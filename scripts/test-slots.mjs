// Edge-case tests for the pure booking logic in src/js/booking/slots.js.
// No test framework needed: Node's built-in runner covers this.
// Run with: node --test scripts/test-slots.mjs

import test from 'node:test';
import assert from 'node:assert/strict';

import { getFreeSlots, isDaySelectable, resolveBarber } from '../src/js/booking/slots.js';
import { zurichInstant } from '../src/js/booking/time.js';

// Fixed reference instant: Tuesday 2026-11-03, 08:00 Europe/Zurich.
// Tuesday/Wednesday/Friday open 09:00–19:00, Thursday 09:00–21:00,
// Saturday 08:30–17:00, Monday/Sunday closed (src/data/hours.js).
const NOW_TODAY = zurichInstant(2026, 11, 3, 8, 0);
// An instant on an earlier day, used whenever a test must *not* be affected
// by the "less than 2h away" rule (that rule only applies to "today").
const NOW_EARLIER = zurichInstant(2026, 11, 1, 8, 0);

test('a closed day never has free slots', () => {
  const slots = getFreeSlots({
    dateKey: '2026-11-02', // Monday, closed
    serviceMinutes: 45,
    barberId: 'karim',
    now: NOW_EARLIER,
  });
  assert.deepEqual(slots, []);
});

test('end of day: the service must fit entirely before closing', () => {
  const slots = getFreeSlots({
    dateKey: '2026-11-03', // Tuesday, 09:00–19:00
    serviceMinutes: 45,
    barberId: 'karim',
    now: NOW_EARLIER,
  });
  assert.ok(slots.includes('18:15'), '18:15 + 45min ends exactly at closing, should be offered');
  assert.ok(!slots.includes('18:30'), '18:30 + 45min would run past closing, must not be offered');
});

test('a long 120-minute service loses the slots too close to closing', () => {
  const slots = getFreeSlots({
    dateKey: '2026-11-03', // Tuesday, 09:00–19:00
    serviceMinutes: 120, // "Le Rituel Fade District"
    barberId: 'karim',
    now: NOW_EARLIER,
  });
  assert.ok(slots.includes('17:00'), '17:00 + 120min ends exactly at closing, should be offered');
  assert.ok(!slots.includes('17:15'), '17:15 + 120min would run past closing, must not be offered');
});

test('a block in the middle of the day removes only the overlapping slots', () => {
  const blocks = [{ barberId: 'karim', date: '2026-11-03', start: '12:00', end: '13:00', reason: 'pause' }];

  const slots = getFreeSlots({
    dateKey: '2026-11-03',
    serviceMinutes: 45,
    barberId: 'karim',
    blocks,
    now: NOW_EARLIER,
  });

  assert.ok(slots.includes('11:00'), '11:00–11:45 ends exactly when the block starts, should stay free');
  assert.ok(!slots.includes('11:45'), '11:45–12:30 overlaps the block, must be removed');
  assert.ok(!slots.includes('12:45'), '12:45–13:30 overlaps the block, must be removed');
  assert.ok(slots.includes('13:00'), '13:00–13:45 starts exactly when the block ends, should be free again');
});

test('slots less than 2 hours away are hidden only for today', () => {
  const slots = getFreeSlots({
    dateKey: '2026-11-03', // same calendar day as NOW_TODAY (08:00)
    serviceMinutes: 45,
    barberId: 'karim',
    now: NOW_TODAY,
  });

  assert.ok(!slots.includes('09:00'), '09:00 is less than 2h after 08:00, must be hidden');
  assert.ok(!slots.includes('09:45'), '09:45 is less than 2h after 08:00, must be hidden');
  assert.ok(slots.includes('10:00'), '10:00 is exactly 2h after 08:00, must be offered');
});

test('"Peu importe" stays available if only one barber is busy, disappears if both are', () => {
  const oneBusy = [{ barberId: 'karim', date: '2026-11-03', start: '09:00', end: '09:45', status: 'confirmed' }];
  const bothBusy = [
    ...oneBusy,
    { barberId: 'leo', date: '2026-11-03', start: '09:00', end: '09:45', status: 'confirmed' },
  ];

  const withOneBusy = getFreeSlots({
    dateKey: '2026-11-03',
    serviceMinutes: 45,
    barberId: 'any',
    appointments: oneBusy,
    now: NOW_EARLIER,
  });
  assert.ok(withOneBusy.includes('09:00'), 'Léo is still free at 09:00, "Peu importe" should offer it');

  const withBothBusy = getFreeSlots({
    dateKey: '2026-11-03',
    serviceMinutes: 45,
    barberId: 'any',
    appointments: bothBusy,
    now: NOW_EARLIER,
  });
  assert.ok(!withBothBusy.includes('09:00'), 'both barbers are busy at 09:00, "Peu importe" must hide it');
});

test('resolveBarber picks the free barber for "Peu importe", or null if nobody is free', () => {
  const karimBusy = [{ barberId: 'karim', date: '2026-11-03', start: '09:00', end: '09:45', status: 'confirmed' }];

  const resolved = resolveBarber({
    barberId: 'any',
    dateKey: '2026-11-03',
    startMinutes: 9 * 60,
    serviceMinutes: 45,
    appointments: karimBusy,
  });
  assert.equal(resolved, 'leo');

  const bothBusy = [
    ...karimBusy,
    { barberId: 'leo', date: '2026-11-03', start: '09:00', end: '09:45', status: 'confirmed' },
  ];
  const nobodyFree = resolveBarber({
    barberId: 'any',
    dateKey: '2026-11-03',
    startMinutes: 9 * 60,
    serviceMinutes: 45,
    appointments: bothBusy,
  });
  assert.equal(nobodyFree, null);
});

test('isDaySelectable rejects past days, closed days, and days beyond 30 ahead', () => {
  assert.equal(isDaySelectable('2026-10-20', { now: NOW_TODAY }), false, 'past day');
  assert.equal(isDaySelectable('2026-11-02', { now: NOW_TODAY }), false, 'closed day (Monday), even if in range');
  assert.equal(isDaySelectable('2026-12-03', { now: NOW_TODAY }), true, 'exactly 30 days ahead, open Thursday');
  assert.equal(isDaySelectable('2026-12-04', { now: NOW_TODAY }), false, '31 days ahead, too far');
});

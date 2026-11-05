// Pure opening-hours / availability logic — no DOM, no storage, so it can
// be unit tested on its own (see scripts/test-slots.mjs).

import { hours as defaultHours } from '../../data/hours.js';
import { barbers, anyBarberId } from '../../data/barbers.js';
import {
  todayDateKey,
  addDaysToDateKey,
  weekdayOfDateKey,
  compareDateKeys,
  timeToMinutes,
  minutesToTime,
  zurichInstant,
  parseDateKey,
  formatDateKey,
} from './time.js';

export const SLOT_STEP_MINUTES = 15;
export const MAX_DAYS_AHEAD = 30;
export const MIN_LEAD_MINUTES = 120;

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// { open, close } in minutes-since-midnight, or null when the salon is closed that day.
export function getOpenInterval(dateKey, hoursData = defaultHours) {
  const row = hoursData.find((candidate) => candidate.day === weekdayOfDateKey(dateKey));
  if (!row || !row.open || !row.close) return null;
  return { open: timeToMinutes(row.open), close: timeToMinutes(row.close) };
}

export function isDaySelectable(
  dateKey,
  { hoursData = defaultHours, now = new Date(), maxDaysAhead = MAX_DAYS_AHEAD } = {},
) {
  const todayKey = todayDateKey(now);
  if (compareDateKeys(dateKey, todayKey) < 0) return false;
  if (compareDateKeys(dateKey, addDaysToDateKey(todayKey, maxDaysAhead)) > 0) return false;
  return getOpenInterval(dateKey, hoursData) !== null;
}

// One entry per day of the given month, for the step-2 month calendar.
export function getCalendarDays({
  year,
  month,
  hoursData = defaultHours,
  now = new Date(),
  maxDaysAhead = MAX_DAYS_AHEAD,
}) {
  const todayKey = todayDateKey(now);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const days = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = formatDateKey(year, month, day);
    days.push({
      dateKey,
      day,
      weekday: weekdayOfDateKey(dateKey),
      isToday: dateKey === todayKey,
      isClosed: getOpenInterval(dateKey, hoursData) === null,
      disabled: !isDaySelectable(dateKey, { hoursData, now, maxDaysAhead }),
    });
  }
  return days;
}

// True when `barberId` has no appointment and no block overlapping the given window.
export function barberIsFree({ barberId, dateKey, startMinutes, endMinutes, appointments = [], blocks = [] }) {
  const hasConflict = (list) =>
    list.some((item) => {
      if (item.barberId !== barberId || item.date !== dateKey) return false;
      if (item.status === 'cancelled') return false;
      return overlaps(startMinutes, endMinutes, timeToMinutes(item.start), timeToMinutes(item.end));
    });

  return !hasConflict(appointments) && !hasConflict(blocks);
}

// All 15-minute slots where the service fits before closing and at least one
// eligible barber is free (both barbers, when barberId is "any").
export function getFreeSlots({
  dateKey,
  serviceMinutes,
  barberId,
  hoursData = defaultHours,
  appointments = [],
  blocks = [],
  now = new Date(),
  step = SLOT_STEP_MINUTES,
  minLeadMinutes = MIN_LEAD_MINUTES,
}) {
  const interval = getOpenInterval(dateKey, hoursData);
  if (!interval) return [];

  const isToday = dateKey === todayDateKey(now);
  const { year, month, day } = parseDateKey(dateKey);
  const cutoff = isToday ? now.getTime() + minLeadMinutes * 60000 : null;
  const barberIds = barberId === anyBarberId ? barbers.map((barber) => barber.id) : [barberId];

  const slots = [];
  for (let start = interval.open; start + serviceMinutes <= interval.close; start += step) {
    if (cutoff !== null) {
      const slotInstant = zurichInstant(year, month, day, Math.floor(start / 60), start % 60);
      if (slotInstant.getTime() < cutoff) continue;
    }

    const end = start + serviceMinutes;
    const hasFreeBarber = barberIds.some((id) =>
      barberIsFree({ barberId: id, dateKey, startMinutes: start, endMinutes: end, appointments, blocks }),
    );
    if (hasFreeBarber) slots.push(minutesToTime(start));
  }
  return slots;
}

// Picks the actual barber for a slot booked as "Peu importe".
// Returns null if, by the time of confirmation, nobody is free anymore.
export function resolveBarber({ barberId, dateKey, startMinutes, serviceMinutes, appointments = [], blocks = [] }) {
  if (barberId !== anyBarberId) return barberId;

  const endMinutes = startMinutes + serviceMinutes;
  const free = barbers.find((barber) =>
    barberIsFree({ barberId: barber.id, dateKey, startMinutes, endMinutes, appointments, blocks }),
  );
  return free ? free.id : null;
}

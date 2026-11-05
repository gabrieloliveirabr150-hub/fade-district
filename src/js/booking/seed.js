// Generates ~20 fictional appointments spread across the current week,
// computed from "today" so the demo always looks freshly used.

import { categories } from '../../data/services.js';
import { barbers } from '../../data/barbers.js';
import { addDaysToDateKey, startOfWeek, minutesToTime, timeToMinutes } from './time.js';
import { getOpenInterval } from './slots.js';

const allServices = categories.flatMap((category) => category.services);

// Clearly fictional names, so nobody mistakes the demo for real client data.
const FIRST_NAMES = ['Antoine', 'Yanis', 'Mehdi', 'Lucas', 'Nicolas', 'Samuel', 'Tiago', 'Noé', 'Gabriel', 'Enzo'];
const LAST_NAMES = ['Dupraz', 'Favre', 'Moret', 'Bertrand', 'Nguyen', 'Costa', 'Perret', 'Blanc', 'Rossier', 'Keller'];

function pick(list, index) {
  return list[index % list.length];
}

function fakePhone(index) {
  return `+41 79 ${String(100 + index).padStart(3, '0')} ${String(10 + index).padStart(2, '0')} ${String(20 + index).padStart(2, '0')}`;
}

export function seedAppointments(anchorDateKey) {
  const appointments = [];
  let seedIndex = 0;

  // Monday of the anchor's week through Sunday (skips the days the salon is closed anyway).
  const monday = startOfWeek(anchorDateKey);

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const dateKey = addDaysToDateKey(monday, dayOffset);
    const interval = getOpenInterval(dateKey);
    if (!interval) continue;

    // 4 appointments per open day (5 open days/week → ~20 total), spread through the day.
    const slotsPerDay = 4;
    for (let slot = 0; slot < slotsPerDay; slot += 1) {
      const service = pick(allServices, seedIndex);
      const barber = pick(barbers, seedIndex);

      const span = interval.close - interval.open - service.minutes;
      const offset = Math.max(0, Math.round((span / slotsPerDay) * slot + 30));
      const startMinutes = Math.min(interval.open + offset, interval.close - service.minutes);
      const start = minutesToTime(Math.round(startMinutes / 15) * 15);
      const end = minutesToTime(timeToMinutes(start) + service.minutes);

      appointments.push({
        id: `seed-${dateKey}-${slot}-${barber.id}`,
        date: dateKey,
        start,
        end,
        barberId: barber.id,
        serviceId: service.id,
        firstName: pick(FIRST_NAMES, seedIndex),
        lastName: pick(LAST_NAMES, seedIndex + 3),
        phone: fakePhone(seedIndex),
        email: '',
        note: '',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      });

      seedIndex += 1;
    }
  }

  return appointments;
}

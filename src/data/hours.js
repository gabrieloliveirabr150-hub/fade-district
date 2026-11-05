// Single source of truth for opening hours.
// Used by the homepage hours table (src/js/hours.js) and by the booking
// engine (src/js/booking/slots.js) so both always agree.
//
// day: 0-6, same numbering as Date.getDay() (0 = Sunday … 6 = Saturday)
// open/close: 'HH:mm' in Europe/Zurich local time, or null when closed.

export const hours = [
  { day: 0, label: 'Dimanche', open: null, close: null },
  { day: 1, label: 'Lundi', open: null, close: null },
  { day: 2, label: 'Mardi', open: '09:00', close: '19:00' },
  { day: 3, label: 'Mercredi', open: '09:00', close: '19:00' },
  { day: 4, label: 'Jeudi', open: '09:00', close: '21:00' },
  { day: 5, label: 'Vendredi', open: '09:00', close: '19:00' },
  { day: 6, label: 'Samedi', open: '08:30', close: '17:00' },
];

export function hoursForDay(day) {
  return hours.find((row) => row.day === day) ?? null;
}

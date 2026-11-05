// Europe/Zurich time helpers, written without a date library.
//
// The demo must behave the same way no matter which timezone the browser
// testing it is set to (the salon is in Geneva), so every "now" and every
// opening-hours comparison goes through here instead of raw Date math.

const ZURICH = 'Europe/Zurich';

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Offset (in minutes) of Europe/Zurich from UTC *at the given instant*
// (so it already accounts for CET/CEST). Positive = ahead of UTC.
function zurichOffsetMinutes(date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: ZURICH,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map = Object.fromEntries(dtf.formatToParts(date).map((part) => [part.type, part.value]));
  const asUTC = Date.UTC(+map.year, +map.month - 1, +map.day, +map.hour, +map.minute, +map.second);
  return (asUTC - date.getTime()) / 60000;
}

// Reads any instant (Date) as Europe/Zurich wall-clock components.
export function zurichParts(date = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: ZURICH,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  });
  const map = Object.fromEntries(dtf.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: +map.year,
    month: +map.month,
    day: +map.day,
    hour: +map.hour,
    minute: +map.minute,
    second: +map.second,
    weekday: WEEKDAY_INDEX[map.weekday],
  };
}

// Builds the real instant (Date) for a given Europe/Zurich wall-clock time.
export function zurichInstant(year, month, day, hour = 0, minute = 0, second = 0) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = zurichOffsetMinutes(guess);
  return new Date(guess.getTime() - offset * 60000);
}

export function formatDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return { year, month, day };
}

// Noon instant for a date key — the safe, DST-proof anchor to pass to an
// Intl.DateTimeFormat when all that's needed is to display the calendar date.
export function noonInstant(dateKey) {
  const { year, month, day } = parseDateKey(dateKey);
  return zurichInstant(year, month, day, 12, 0);
}

// 'YYYY-MM-DD' for the current day in Geneva, regardless of the browser's timezone.
export function todayDateKey(now = new Date()) {
  const { year, month, day } = zurichParts(now);
  return formatDateKey(year, month, day);
}

// Pure calendar arithmetic (no timezone involved): shifts a date key by n days.
export function addDaysToDateKey(dateKey, days) {
  const { year, month, day } = parseDateKey(dateKey);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return formatDateKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

// Weekday (0 = Sunday … 6 = Saturday) of a date key, matching Date.getDay().
export function weekdayOfDateKey(dateKey) {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

// Monday of the week containing dateKey.
export function startOfWeek(dateKey) {
  const weekday = weekdayOfDateKey(dateKey);
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return addDaysToDateKey(dateKey, mondayOffset);
}

export function compareDateKeys(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function timeToMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function minutesToTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

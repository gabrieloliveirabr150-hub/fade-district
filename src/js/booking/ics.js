// Builds a minimal .ics file for "Ajouter à mon calendrier" — no dependency,
// just the handful of VEVENT lines every calendar app understands.

import { zurichInstant, parseDateKey } from './time.js';

function formatIcsDate(date) {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

function escapeIcsText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function buildIcs({ dateKey, start, end, title, description, location }) {
  const { year, month, day } = parseDateKey(dateKey);
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  const startInstant = zurichInstant(year, month, day, startHour, startMinute);
  const endInstant = zurichInstant(year, month, day, endHour, endMinute);
  const now = new Date();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fade District//Démo réservation//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${now.getTime()}-${Math.random().toString(36).slice(2, 8)}@fadedistrict1.netlify.app`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(startInstant)}`,
    `DTEND:${formatIcsDate(endInstant)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : null,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function downloadIcs(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

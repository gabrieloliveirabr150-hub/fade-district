// Builds the opening-hours table from src/data/hours.js (the same source
// the booking engine uses) and highlights today's row.

import { hours } from '../data/hours.js';

// '09:00' → '9h00' (French style, no leading zero on the hour)
function formatHour(time) {
  const [hour, minute] = time.split(':');
  return `${Number(hour)}h${minute}`;
}

function rowHtml({ day, label, open, close }) {
  const isClosed = !open || !close;
  const cell = isClosed ? 'Fermé' : `${formatHour(open)} – ${formatHour(close)}`;
  return `<tr data-day="${day}"${isClosed ? ' class="is-closed"' : ''}><th scope="row">${label}</th><td>${cell}</td></tr>`;
}

export function renderHours() {
  const table = document.querySelector('[data-hours-table]');
  if (!table) return;

  // Display order starts on Monday, like the calendar in the booking page.
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];
  table.innerHTML = displayOrder.map((day) => rowHtml(hours.find((row) => row.day === day))).join('');
}

export function highlightToday() {
  const today = new Date().getDay();
  const row = document.querySelector(`.hours [data-day="${today}"]`);
  if (row) row.classList.add('is-today');
}

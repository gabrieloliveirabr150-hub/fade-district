// Highlights today's row in the opening-hours table.
// Each row has data-day="0" to "6": 0 = Sunday … 6 = Saturday,
// the same numbering JavaScript's Date.getDay() uses.

export function highlightToday() {
  const today = new Date().getDay();
  const row = document.querySelector(`.hours [data-day="${today}"]`);

  if (row) row.classList.add('is-today');
}

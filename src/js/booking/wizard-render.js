// Pure template builders for the booking wizard: turn data into HTML strings.
// Event wiring and state live in wizard.js.

import { formatPrice, formatDuration } from '../services-menu.js';

export function renderServiceOptions(container, { categories, selectedId }) {
  container.innerHTML = categories
    .map(
      (category) => `
    <fieldset class="booking-category">
      <legend class="booking-category__title">${category.title}</legend>
      <div class="service-option-list" role="radiogroup" aria-label="${category.title}">
        ${category.services.map((service) => serviceOptionHtml(service, selectedId)).join('')}
      </div>
    </fieldset>`,
    )
    .join('');
}

function serviceOptionHtml(service, selectedId) {
  return `
    <button type="button" class="service-option" data-service-id="${service.id}" aria-pressed="${service.id === selectedId}">
      <span class="service-option__name">${service.name}</span>
      <span class="service-option__meta">${formatDuration(service.minutes)} · ${formatPrice(service.price)}</span>
    </button>`;
}

export function renderBarberOptions(container, { options, selectedId }) {
  container.innerHTML = options
    .map(
      (barber) => `
    <button type="button" class="barber-option" data-barber-id="${barber.id}" aria-pressed="${barber.id === selectedId}">
      ${barber.name}
    </button>`,
    )
    .join('');
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function renderWeekdayHeader(container) {
  container.innerHTML = WEEKDAY_LABELS.map((label) => `<span class="booking-calendar__weekday">${label}</span>`).join(
    '',
  );
}

export function renderCalendarGrid(container, { days, selectedDateKey }) {
  // Grid starts on Monday: convert Date.getDay() (0 = Sunday) to a Monday-first index.
  const firstWeekdayIndex = (days[0].weekday + 6) % 7;
  const blanks = Array.from(
    { length: firstWeekdayIndex },
    () => '<span class="booking-calendar__cell booking-calendar__cell--blank" aria-hidden="true"></span>',
  );
  container.innerHTML = [...blanks, ...days.map((day) => calendarCellHtml(day, selectedDateKey))].join('');
}

function calendarCellHtml(day, selectedDateKey) {
  if (day.disabled) {
    return `<span class="booking-calendar__cell booking-calendar__cell--disabled" aria-hidden="true">${day.day}</span>`;
  }
  const current = day.isToday ? ' aria-current="date"' : '';
  return `
    <button type="button" class="booking-calendar__cell booking-calendar__cell--day"
      data-date-key="${day.dateKey}" aria-pressed="${day.dateKey === selectedDateKey}"${current}>${day.day}</button>`;
}

export function renderSlots(container, { slots, selectedStart }) {
  if (slots.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = slots
    .map(
      (time) =>
        `<button type="button" class="slot-option" data-slot="${time}" aria-pressed="${time === selectedStart}">${time}</button>`,
    )
    .join('');
}

export function renderSummary(container, { service, barberLabel, dateLabel, start, end }) {
  container.innerHTML = `
    <div class="summary-row"><dt>Prestation</dt><dd>${service.name}</dd></div>
    <div class="summary-row"><dt>Barbier</dt><dd>${barberLabel}</dd></div>
    <div class="summary-row"><dt>Date</dt><dd>${dateLabel}</dd></div>
    <div class="summary-row"><dt>Heure</dt><dd>${start} – ${end}</dd></div>
    <div class="summary-row"><dt>Durée</dt><dd>${formatDuration(service.minutes)}</dd></div>
    <div class="summary-row summary-row--price"><dt>Total</dt><dd>${formatPrice(service.price)}</dd></div>`;
}

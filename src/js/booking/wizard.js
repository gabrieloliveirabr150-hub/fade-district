// Controls the 4-step booking flow: state, navigation, validation and the
// calls to the store. Rendering templates live in wizard-render.js.

import { categories } from '../../data/services.js';
import { barbers, anyBarberId, barberName } from '../../data/barbers.js';
import { findServiceById } from '../services-menu.js';
import { createAppointment, listAppointments, listBlocks } from './store.js';
import { getCalendarDays, getFreeSlots } from './slots.js';
import { todayDateKey, parseDateKey, timeToMinutes, minutesToTime, zurichInstant, noonInstant } from './time.js';
import { buildIcs, downloadIcs } from './ics.js';
import { renderServiceOptions, renderBarberOptions, renderWeekdayHeader, renderCalendarGrid, renderSlots, renderSummary } from './wizard-render.js';

const BARBER_OPTIONS = [...barbers, { id: anyBarberId, name: 'Peu importe' }];

const MONTH_FORMATTER = new Intl.DateTimeFormat('fr-CH', { month: 'long', year: 'numeric', timeZone: 'Europe/Zurich' });
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-CH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Zurich',
});

const FIELD_ERROR_IDS = {
  firstName: 'field-first-name-error',
  lastName: 'field-last-name-error',
  phone: 'field-phone-error',
  email: 'field-email-error',
};

function dateLabel(dateKey) {
  return DATE_FORMATTER.format(noonInstant(dateKey));
}

function shiftMonth(year, month, delta) {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export function initWizard(root) {
  if (!root) return;

  const stepItems = root.querySelectorAll('[data-step-item]');
  const stepSections = root.querySelectorAll('[data-booking-step]');
  const form = root.querySelector('[data-booking-form]');
  const actions = root.querySelector('[data-booking-actions]');
  const backBtn = root.querySelector('[data-step-back]');
  const nextBtn = root.querySelector('[data-step-next]');
  const confirmBtn = root.querySelector('[data-step-confirm]');

  const step1Categories = root.querySelector('[data-step1-categories]');
  const barberOptionsEl = root.querySelector('[data-barber-options]');
  const step1Error = root.querySelector('[data-step1-error]');

  const calendarMonthEl = root.querySelector('[data-calendar-month]');
  const calendarWeekdaysEl = root.querySelector('[data-calendar-weekdays]');
  const calendarGridEl = root.querySelector('[data-calendar-grid]');
  const calendarPrevBtn = root.querySelector('[data-calendar-prev]');
  const calendarNextBtn = root.querySelector('[data-calendar-next]');
  const slotsWrap = root.querySelector('[data-slots-wrap]');
  const slotsGridEl = root.querySelector('[data-slots-grid]');
  const slotsEmptyEl = root.querySelector('[data-slots-empty]');
  const step2Error = root.querySelector('[data-step2-error]');

  const summaryEl = root.querySelector('[data-summary]');
  const confirmErrorEl = root.querySelector('[data-confirm-error]');

  const fillExampleBtn = root.querySelector('[data-fill-example]');

  const successSummaryEl = root.querySelector('[data-success-summary]');
  const downloadIcsBtn = root.querySelector('[data-download-ics]');
  const viewInAdminLink = root.querySelector('[data-view-in-admin]');

  const today = todayDateKey();
  const { year: todayYear, month: todayMonth } = parseDateKey(today);

  const state = {
    step: 1,
    serviceId: null,
    barberId: null,
    calendarYear: todayYear,
    calendarMonth: todayMonth,
    dateKey: null,
    start: null,
    confirmed: null,
  };

  renderWeekdayHeader(calendarWeekdaysEl);
  renderServiceOptions(step1Categories, { categories, selectedId: state.serviceId });
  renderBarberOptions(barberOptionsEl, { options: BARBER_OPTIONS, selectedId: state.barberId });
  renderCalendarMonth();
  updateStepUI();

  step1Categories.addEventListener('click', (event) => {
    const button = event.target.closest('[data-service-id]');
    if (!button) return;
    state.serviceId = button.dataset.serviceId;
    state.dateKey = null;
    state.start = null;
    for (const el of step1Categories.querySelectorAll('[data-service-id]')) {
      el.setAttribute('aria-pressed', String(el === button));
    }
    step1Error.hidden = true;
  });

  barberOptionsEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-barber-id]');
    if (!button) return;
    state.barberId = button.dataset.barberId;
    state.start = null;
    for (const el of barberOptionsEl.querySelectorAll('[data-barber-id]')) {
      el.setAttribute('aria-pressed', String(el === button));
    }
    step1Error.hidden = true;
  });

  calendarPrevBtn.addEventListener('click', () => {
    const { year, month } = shiftMonth(state.calendarYear, state.calendarMonth, -1);
    state.calendarYear = year;
    state.calendarMonth = month;
    renderCalendarMonth();
  });

  calendarNextBtn.addEventListener('click', () => {
    const { year, month } = shiftMonth(state.calendarYear, state.calendarMonth, 1);
    state.calendarYear = year;
    state.calendarMonth = month;
    renderCalendarMonth();
  });

  calendarGridEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-date-key]');
    if (!button) return;
    state.dateKey = button.dataset.dateKey;
    state.start = null;
    for (const el of calendarGridEl.querySelectorAll('[data-date-key]')) {
      el.setAttribute('aria-pressed', String(el === button));
    }
    step2Error.hidden = true;
    renderSlotsForSelectedDate();
  });

  // Arrow-key roving navigation across the day grid (left/right/up/down/home/end),
  // skipping blank and disabled cells.
  calendarGridEl.addEventListener('keydown', (event) => {
    const keys = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: 'home', End: 'end' };
    if (!(event.key in keys)) return;
    const cells = [...calendarGridEl.children];
    const currentIndex = cells.indexOf(event.target);
    if (currentIndex === -1) return;

    event.preventDefault();
    const step = keys[event.key];
    let targetIndex;
    if (step === 'home') targetIndex = cells.findIndex((cell) => cell.matches('button'));
    else if (step === 'end') targetIndex = cells.map((cell) => cell.matches('button')).lastIndexOf(true);
    else {
      targetIndex = currentIndex + step;
      while (targetIndex >= 0 && targetIndex < cells.length && !cells[targetIndex].matches('button')) {
        targetIndex += step > 0 ? 1 : -1;
      }
    }
    cells[targetIndex]?.focus();
  });

  slotsGridEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-slot]');
    if (!button) return;
    state.start = button.dataset.slot;
    for (const el of slotsGridEl.querySelectorAll('[data-slot]')) {
      el.setAttribute('aria-pressed', String(el === button));
    }
    step2Error.hidden = true;
  });

  backBtn.addEventListener('click', () => {
    if (state.step > 1) {
      state.step -= 1;
      updateStepUI();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (!validateStep(state.step)) return;
    if (state.step === 2) renderSummaryStep();
    state.step += 1;
    updateStepUI();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.step !== 4) return;
    await confirmBooking();
  });

  fillExampleBtn.addEventListener('click', () => {
    form.querySelector('[data-field="firstName"]').value = 'Camille';
    form.querySelector('[data-field="lastName"]').value = 'Exemple';
    form.querySelector('[data-field="phone"]').value = '+41 79 000 00 00';
    form.querySelector('[data-field="email"]').value = 'exemple@fadedistrict.example';
  });

  downloadIcsBtn.addEventListener('click', () => {
    if (!state.confirmed) return;
    const { appointment, service } = state.confirmed;
    const content = buildIcs({
      dateKey: appointment.date,
      start: appointment.start,
      end: appointment.end,
      title: `${service.name} — Fade District`,
      description: `Rendez-vous avec ${barberName(appointment.barberId)} chez Fade District.`,
      location: 'Fade District, Genève',
    });
    downloadIcs(`fade-district-${appointment.date}.ics`, content);
  });

  function renderCalendarMonth() {
    const instant = zurichInstant(state.calendarYear, state.calendarMonth, 1, 12, 0);
    calendarMonthEl.textContent = capitalize(MONTH_FORMATTER.format(instant));

    const days = getCalendarDays({ year: state.calendarYear, month: state.calendarMonth });
    renderCalendarGrid(calendarGridEl, { days, selectedDateKey: state.dateKey });

    calendarPrevBtn.disabled = isPastMonth(shiftMonth(state.calendarYear, state.calendarMonth, -1));
    calendarNextBtn.disabled = isFarFutureMonth(shiftMonth(state.calendarYear, state.calendarMonth, 1));
  }

  function isPastMonth({ year, month }) {
    return year < todayYear || (year === todayYear && month < todayMonth);
  }

  function isFarFutureMonth({ year, month }) {
    const diff = (year - todayYear) * 12 + (month - todayMonth);
    return diff >= 2;
  }

  async function renderSlotsForSelectedDate() {
    if (!state.dateKey || !state.serviceId) return;
    const service = findServiceById(state.serviceId);
    const [appointments, blocks] = await Promise.all([
      listAppointments({ date: state.dateKey }),
      listBlocks({ date: state.dateKey }),
    ]);
    const slots = getFreeSlots({
      dateKey: state.dateKey,
      serviceMinutes: service.minutes,
      barberId: state.barberId,
      appointments,
      blocks,
    });

    renderSlots(slotsGridEl, { slots, selectedStart: state.start });
    slotsWrap.hidden = false;
    slotsEmptyEl.hidden = slots.length > 0;
  }

  function validateStep(step) {
    if (step === 1) {
      if (!state.serviceId || !state.barberId) {
        step1Error.textContent = 'Choisissez une prestation et un barbier.';
        step1Error.hidden = false;
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!state.dateKey || !state.start) {
        step2Error.textContent = 'Choisissez une date et une heure.';
        step2Error.hidden = false;
        return false;
      }
      return true;
    }
    if (step === 3) return validateContactStep();
    return true;
  }

  function getContactValues() {
    return {
      firstName: form.querySelector('[data-field="firstName"]').value,
      lastName: form.querySelector('[data-field="lastName"]').value,
      phone: form.querySelector('[data-field="phone"]').value,
      email: form.querySelector('[data-field="email"]').value,
      note: form.querySelector('[data-field="note"]').value,
    };
  }

  function validateContactStep() {
    const values = getContactValues();
    const errors = {};
    if (!values.firstName.trim()) errors.firstName = 'Merci d’indiquer votre prénom.';
    if (!values.lastName.trim()) errors.lastName = 'Merci d’indiquer votre nom.';
    if (!/^[0-9+\s().-]{6,}$/.test(values.phone.trim())) {
      errors.phone = 'Merci d’indiquer un numéro de téléphone valide.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errors.email = 'Merci d’indiquer une adresse e-mail valide.';
    }

    let firstInvalid = null;
    for (const key of Object.keys(FIELD_ERROR_IDS)) {
      const input = form.querySelector(`[data-field="${key}"]`);
      const errorEl = document.getElementById(FIELD_ERROR_IDS[key]);
      const message = errors[key];
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      errorEl.textContent = message ?? '';
      errorEl.hidden = !message;
      if (message && !firstInvalid) firstInvalid = input;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function renderSummaryStep() {
    const service = findServiceById(state.serviceId);
    renderSummary(summaryEl, {
      service,
      barberLabel: barberName(state.barberId),
      dateLabel: dateLabel(state.dateKey),
      start: state.start,
      end: minutesToTime(timeToMinutes(state.start) + service.minutes),
    });
  }

  async function confirmBooking() {
    const service = findServiceById(state.serviceId);
    const contact = getContactValues();
    const start = state.start;
    const end = minutesToTime(timeToMinutes(start) + service.minutes);

    confirmErrorEl.hidden = true;
    confirmBtn.disabled = true;
    try {
      const appointment = await createAppointment({
        serviceId: service.id,
        barberId: state.barberId,
        date: state.dateKey,
        start,
        end,
        firstName: contact.firstName.trim(),
        lastName: contact.lastName.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim(),
        note: contact.note.trim(),
      });

      state.confirmed = { appointment, service };
      renderSummary(successSummaryEl, {
        service,
        barberLabel: barberName(appointment.barberId),
        dateLabel: dateLabel(appointment.date),
        start: appointment.start,
        end: appointment.end,
      });
      viewInAdminLink.href = `/admin.html?date=${appointment.date}&rdv=${appointment.id}`;
      state.step = 'success';
      updateStepUI();
    } catch (error) {
      confirmErrorEl.textContent = error.message;
      confirmErrorEl.hidden = false;
    } finally {
      confirmBtn.disabled = false;
    }
  }

  function updateStepUI() {
    for (const section of stepSections) {
      section.hidden = section.dataset.bookingStep !== String(state.step);
    }

    const isSuccess = state.step === 'success';
    root.querySelector('[data-step-list]').hidden = isSuccess;
    actions.hidden = isSuccess;

    if (!isSuccess) {
      for (const item of stepItems) {
        const itemStep = Number(item.dataset.stepItem);
        item.classList.toggle('is-current', itemStep === state.step);
        item.classList.toggle('is-done', itemStep < state.step);
        if (itemStep === state.step) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      }
      backBtn.disabled = state.step === 1;
      nextBtn.hidden = state.step === 4;
      confirmBtn.hidden = state.step !== 4;
    }

    // Each step starts scrolled to its own heading, not wherever the previous,
    // possibly taller or shorter, step left the page.
    window.scrollTo(0, 0);
  }
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

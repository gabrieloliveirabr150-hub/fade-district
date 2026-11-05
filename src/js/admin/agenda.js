// Day/week agenda: fetches appointments + blocks from the store and renders
// them as a single time-sorted list, with inline (non-browser) confirmation
// for the three actions a barber can take on a booking.

import { listAppointments, listBlocks, updateAppointment } from '../booking/store.js';
import { barberName } from '../../data/barbers.js';
import { findServiceById, formatDuration } from '../services-menu.js';
import { todayDateKey, addDaysToDateKey, startOfWeek, noonInstant } from '../booking/time.js';
import { escapeHtml } from '../escape-html.js';

const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat('fr-CH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Zurich',
});
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('fr-CH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/Zurich',
});

const ACTION_TO_STATUS = { done: 'done', 'no-show': 'no-show', cancel: 'cancelled' };
const ACTION_VERB = {
  done: 'marquer ce rendez-vous comme fait',
  'no-show': 'marquer ce rendez-vous comme absent',
  cancel: 'annuler ce rendez-vous',
};
const STATUS_LABEL = { done: 'Terminé', cancelled: 'Annulé', 'no-show': 'Absent' };
const REASON_LABEL = { pause: 'Pause', conge: 'Congé', vacances: 'Vacances' };

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function actionsHtml() {
  return `
    <div class="agenda-item__actions" data-actions>
      <button type="button" class="agenda-action" data-action="done">Fait</button>
      <button type="button" class="agenda-action" data-action="no-show">Absent</button>
      <button type="button" class="agenda-action agenda-action--danger" data-action="cancel">Annuler</button>
    </div>
    <div class="agenda-item__confirm" data-confirm hidden>
      <p data-confirm-text></p>
      <div class="agenda-item__confirm-actions">
        <button type="button" class="btn btn--ghost btn--small" data-confirm-no>Non</button>
        <button type="button" class="btn btn--primary btn--small" data-confirm-yes>Oui</button>
      </div>
    </div>`;
}

function appointmentItemHtml(appointment) {
  const service = findServiceById(appointment.serviceId);
  const statusLabel = STATUS_LABEL[appointment.status];
  const name = `${escapeHtml(appointment.firstName)} ${escapeHtml(appointment.lastName)}`;

  return `
    <li class="agenda-item" data-appointment-id="${appointment.id}">
      <p class="agenda-item__time">${appointment.start}–${appointment.end}</p>
      <div class="agenda-item__body">
        <p class="agenda-item__client">${name} <span class="agenda-item__barber">· ${barberName(appointment.barberId)}</span></p>
        <p class="agenda-item__service">${service ? escapeHtml(service.name) : ''}${service ? ` · ${formatDuration(service.minutes)}` : ''}</p>
        <p class="agenda-item__contact"><a href="tel:${escapeHtml(appointment.phone)}">${escapeHtml(appointment.phone)}</a></p>
        ${appointment.note ? `<p class="agenda-item__note">« ${escapeHtml(appointment.note)} »</p>` : ''}
      </div>
      ${statusLabel ? `<p class="agenda-item__status agenda-item__status--${appointment.status}">${statusLabel}</p>` : actionsHtml()}
    </li>`;
}

function blockItemHtml(block) {
  const reasonLabel = REASON_LABEL[block.reason] ?? block.reason;
  return `
    <li class="agenda-item agenda-item--block">
      <p class="agenda-item__time">${block.start}–${block.end}</p>
      <div class="agenda-item__body">
        <p class="agenda-item__client">Bloqué · ${barberName(block.barberId)}</p>
        <p class="agenda-item__service">${escapeHtml(reasonLabel)}${block.note ? ` · ${escapeHtml(block.note)}` : ''}</p>
      </div>
    </li>`;
}

function renderDayList(appointments, blocks) {
  const entries = [
    ...appointments.map((appointment) => ({ time: appointment.start, html: appointmentItemHtml(appointment) })),
    ...blocks.map((block) => ({ time: block.start, html: blockItemHtml(block) })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  if (entries.length === 0) {
    return '<p class="agenda-empty">Aucun rendez-vous ni blocage ce jour-là.</p>';
  }
  return `<ul class="agenda-list">${entries.map((entry) => entry.html).join('')}</ul>`;
}

function summarize(appointments) {
  const active = appointments.filter((appointment) => appointment.status !== 'cancelled');
  const total = active.reduce((sum, appointment) => sum + (findServiceById(appointment.serviceId)?.price ?? 0), 0);
  return { count: active.length, total };
}

export function initAgenda(root, { initialDate, highlightId } = {}) {
  if (!root) return { refresh: async () => {} };

  const state = { view: 'day', date: initialDate ?? todayDateKey(), barberId: 'all' };

  const viewButtons = [...root.querySelectorAll('[data-view]')];
  const barberButtons = [...root.querySelectorAll('[data-barber-filter]')];
  const dateLabelEl = root.querySelector('[data-date-label]');
  const prevBtn = root.querySelector('[data-date-prev]');
  const nextBtn = root.querySelector('[data-date-next]');
  const todayBtn = root.querySelector('[data-date-today]');
  const summaryEl = root.querySelector('[data-agenda-summary]');
  const listEl = root.querySelector('[data-agenda-list]');

  async function dayData(dateKey) {
    const [appointments, blocks] = await Promise.all([
      listAppointments({ date: dateKey, barberId: state.barberId }),
      listBlocks({ date: dateKey, barberId: state.barberId }),
    ]);
    return { appointments, blocks };
  }

  async function refresh() {
    if (state.view === 'day') {
      dateLabelEl.textContent = capitalize(DATE_LABEL_FORMATTER.format(noonInstant(state.date)));
      const { appointments, blocks } = await dayData(state.date);
      const { count, total } = summarize(appointments);
      summaryEl.textContent = `${count} rendez-vous · CHF ${total}.– prévu`;
      listEl.innerHTML = renderDayList(appointments, blocks);
      return;
    }

    const monday = startOfWeek(state.date);
    const days = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(monday, index));
    dateLabelEl.textContent = `Semaine du ${capitalize(SHORT_DATE_FORMATTER.format(noonInstant(monday)))}`;

    const results = await Promise.all(days.map((dateKey) => dayData(dateKey)));
    const { count, total } = summarize(results.flatMap((result) => result.appointments));
    summaryEl.textContent = `${count} rendez-vous cette semaine · CHF ${total}.– prévu`;

    listEl.innerHTML = days
      .map(
        (dateKey, index) => `
      <section class="agenda-day">
        <h3 class="agenda-day__title">${capitalize(SHORT_DATE_FORMATTER.format(noonInstant(dateKey)))}</h3>
        ${renderDayList(results[index].appointments, results[index].blocks)}
      </section>`,
      )
      .join('');
  }

  for (const btn of viewButtons) {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      for (const b of viewButtons) b.setAttribute('aria-pressed', String(b === btn));
      refresh();
    });
  }

  for (const btn of barberButtons) {
    btn.addEventListener('click', () => {
      state.barberId = btn.dataset.barberFilter;
      for (const b of barberButtons) b.setAttribute('aria-pressed', String(b === btn));
      refresh();
    });
  }

  prevBtn.addEventListener('click', () => {
    state.date = addDaysToDateKey(state.date, state.view === 'day' ? -1 : -7);
    refresh();
  });
  nextBtn.addEventListener('click', () => {
    state.date = addDaysToDateKey(state.date, state.view === 'day' ? 1 : 7);
    refresh();
  });
  todayBtn.addEventListener('click', () => {
    state.date = todayDateKey();
    refresh();
  });

  listEl.addEventListener('click', async (event) => {
    const actionBtn = event.target.closest('[data-action]');
    if (actionBtn) {
      const item = actionBtn.closest('[data-appointment-id]');
      const confirmEl = item.querySelector('[data-confirm]');
      item.querySelector('[data-actions]').hidden = true;
      confirmEl.hidden = false;
      confirmEl.dataset.pendingAction = actionBtn.dataset.action;
      confirmEl.querySelector('[data-confirm-text]').textContent = `Confirmer : ${ACTION_VERB[actionBtn.dataset.action]} ?`;
      return;
    }

    const yesBtn = event.target.closest('[data-confirm-yes]');
    if (yesBtn) {
      const item = yesBtn.closest('[data-appointment-id]');
      const action = item.querySelector('[data-confirm]').dataset.pendingAction;
      await updateAppointment(item.dataset.appointmentId, { status: ACTION_TO_STATUS[action] });
      await refresh();
      return;
    }

    const noBtn = event.target.closest('[data-confirm-no]');
    if (noBtn) {
      const item = noBtn.closest('[data-appointment-id]');
      item.querySelector('[data-actions]').hidden = false;
      item.querySelector('[data-confirm]').hidden = true;
    }
  });

  if (highlightId) {
    refresh().then(() => {
      const target = listEl.querySelector(`[data-appointment-id="${highlightId}"]`);
      if (!target) return;
      target.classList.add('agenda-item--highlight');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    });
  } else {
    refresh();
  }

  return { refresh };
}

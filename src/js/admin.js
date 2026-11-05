import '../styles/admin.css';

import { initAuth } from './admin/auth.js';
import { initAgenda } from './admin/agenda.js';
import { initBlockForm } from './admin/blocks.js';
import { initClients } from './admin/clients.js';
import { resetDemo } from './booking/store.js';

document.documentElement.classList.add('js');

let agendaController = null;
let clientsController = null;
let dashboardInitialized = false;

function initTabs() {
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const panels = [...document.querySelectorAll('[data-tab-panel]')];

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      for (const t of tabs) t.setAttribute('aria-selected', String(t === tab));
      for (const panel of panels) panel.hidden = panel.dataset.tabPanel !== tab.dataset.tab;
    });
  }
}

function initResetDemo() {
  const triggerBtn = document.querySelector('[data-reset-demo]');
  const confirmEl = document.querySelector('[data-reset-confirm]');
  const yesBtn = document.querySelector('[data-reset-yes]');
  const noBtn = document.querySelector('[data-reset-no]');
  if (!triggerBtn) return;

  triggerBtn.addEventListener('click', () => {
    triggerBtn.hidden = true;
    confirmEl.hidden = false;
  });

  noBtn.addEventListener('click', () => {
    confirmEl.hidden = true;
    triggerBtn.hidden = false;
  });

  yesBtn.addEventListener('click', async () => {
    await resetDemo();
    confirmEl.hidden = true;
    triggerBtn.hidden = false;
    await Promise.all([agendaController?.refresh(), clientsController?.refresh()]);
  });
}

function initDashboard() {
  // initAuth can call this more than once (password form, demo-login button,
  // already-authenticated on load); only wire everything up the first time,
  // otherwise every listener would end up duplicated.
  if (dashboardInitialized) {
    agendaController?.refresh();
    clientsController?.refresh();
    return;
  }
  dashboardInitialized = true;

  const params = new URLSearchParams(location.search);
  const presentationDate = params.get('date') ?? undefined;
  const presentationRdv = params.get('rdv') ?? undefined;

  initTabs();
  agendaController = initAgenda(document.querySelector('[data-tab-panel="agenda"]'), {
    initialDate: presentationDate,
    highlightId: presentationRdv,
  });
  initBlockForm({ onCreated: () => agendaController.refresh() });
  clientsController = initClients(document.querySelector('[data-tab-panel="clients"]'));
  initResetDemo();
}

initAuth({ onAuthenticated: initDashboard });

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

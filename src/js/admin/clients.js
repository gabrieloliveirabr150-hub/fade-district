// Client list, derived from appointments by the store, with a client-side
// search filter on name and phone.

import { listClients } from '../booking/store.js';
import { noonInstant } from '../booking/time.js';
import { escapeHtml } from '../escape-html.js';

const LAST_VISIT_FORMATTER = new Intl.DateTimeFormat('fr-CH', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Zurich',
});

function clientItemHtml(client) {
  const visits = client.visits === 1 ? '1 visite' : `${client.visits} visites`;
  return `
    <li class="client-item">
      <p class="client-item__name">${escapeHtml(client.firstName)} ${escapeHtml(client.lastName)}</p>
      <p class="client-item__phone">${escapeHtml(client.phone)}</p>
      <p class="client-item__meta">${visits} · dernière le ${LAST_VISIT_FORMATTER.format(noonInstant(client.lastVisit))}</p>
    </li>`;
}

export function initClients(root) {
  if (!root) return { refresh: async () => {} };

  const searchInput = root.querySelector('[data-client-search]');
  const listEl = root.querySelector('[data-client-list]');
  let clients = [];

  function render() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = query
      ? clients.filter((client) => `${client.firstName} ${client.lastName} ${client.phone}`.toLowerCase().includes(query))
      : clients;

    listEl.innerHTML = filtered.length
      ? `<ul class="client-list">${filtered.map(clientItemHtml).join('')}</ul>`
      : '<p class="agenda-empty">Aucun client trouvé.</p>';
  }

  searchInput.addEventListener('input', render);

  async function refresh() {
    clients = await listClients();
    render();
  }

  refresh();
  return { refresh };
}

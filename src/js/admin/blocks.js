// "Bloquer un créneau": a collapsible form that writes a block via the
// store, then asks the caller (admin.js) to refresh the agenda.

import { createBlock } from '../booking/store.js';

export function initBlockForm({ onCreated }) {
  const toggleBtn = document.querySelector('[data-toggle-block-form]');
  const form = document.querySelector('[data-block-form]');
  const cancelBtn = document.querySelector('[data-block-cancel]');
  const errorEl = document.querySelector('[data-block-error]');
  if (!toggleBtn || !form) return;

  function field(name) {
    return form.querySelector(`[data-block-field="${name}"]`);
  }

  function closeForm() {
    form.reset();
    errorEl.hidden = true;
    form.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  toggleBtn.addEventListener('click', () => {
    const wasHidden = form.hidden;
    form.hidden = !wasHidden;
    toggleBtn.setAttribute('aria-expanded', String(wasHidden));
    if (wasHidden) field('barberId').focus();
  });

  cancelBtn.addEventListener('click', () => {
    closeForm();
    toggleBtn.focus();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = {
      barberId: field('barberId').value,
      date: field('date').value,
      start: field('start').value,
      end: field('end').value,
      reason: field('reason').value,
      note: field('note').value.trim(),
    };

    if (!data.date || !data.start || !data.end) {
      errorEl.textContent = 'Merci de renseigner la date et les heures.';
      errorEl.hidden = false;
      return;
    }
    if (data.start >= data.end) {
      errorEl.textContent = "L'heure de fin doit être après l'heure de début.";
      errorEl.hidden = false;
      return;
    }

    errorEl.hidden = true;
    await createBlock(data);
    closeForm();
    await onCreated();
  });
}

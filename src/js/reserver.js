import '../styles/booking.css';

import { initNav } from './nav.js';
import { initWizard } from './booking/wizard.js';

document.documentElement.classList.add('js');

initNav();
initWizard(document.querySelector('[data-booking-wizard]'));

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

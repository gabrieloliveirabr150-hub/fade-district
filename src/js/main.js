// Entry point loaded by every page.
// Importing the CSS here lets Vite process, bundle and hot-reload it.
import '../styles/main.css';

import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { highlightToday } from './hours.js';

// Tells the CSS that JavaScript is running (used by the reveal animation)
document.documentElement.classList.add('js');

initNav();
initReveal();
highlightToday();

// Keep the copyright year in the footer up to date automatically
const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

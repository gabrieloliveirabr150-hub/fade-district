// Entry point loaded by every page.
// Importing the CSS here lets Vite process, bundle and hot-reload it.
import '../styles/main.css';

import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { highlightToday } from './hours.js';
import { renderCategories, renderServiceMenus } from './services-menu.js';
import { initMap } from './map.js';

// Tells the CSS that JavaScript is running (used by the reveal animation)
document.documentElement.classList.add('js');

// Build the service lists first, so the reveal animation can find them
renderCategories();
renderServiceMenus();

initNav();
initReveal();
highlightToday();
initMap();

// 3D razor: import() loads the module (and Three.js) only when this page has
// a razor stage. Vite puts it in a separate file, so other pages stay light.
const razorContainer = document.querySelector('#razor-canvas');
if (razorContainer) {
  import('./razor/hero-razor.js')
    .then(({ initHeroRazor }) => initHeroRazor(razorContainer))
    .catch(() => razorContainer.closest('.hero__stage')?.classList.add('is-static'));
}

// Keep the copyright year in the footer up to date automatically
const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

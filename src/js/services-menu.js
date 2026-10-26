// Turns the data in src/data/services.js into HTML lists.

import { categories, featuredIds } from '../data/services.js';

// 58 → "CHF 58.–"  (Swiss style for round prices)
// 42.5 → "CHF 42.50"
export function formatPrice(price) {
  const amount = Number.isInteger(price) ? `${price}.–` : price.toFixed(2);
  return `CHF ${amount}`;
}

// 45 → "45 min", 60 → "1 h", 90 → "1 h 30"
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`;
}

// HTML for one service. Template literals (backticks) let us write HTML
// with ${...} placeholders. Safe here because the data is written by us,
// never typed in by visitors.
function serviceItem(service) {
  const tag = service.tag ? `<span class="service__tag">${service.tag}</span>` : '';
  return `
    <li class="service">
      <div class="service__head">
        <h3 class="service__name">${service.name}</h3>
        <span class="service__leader" aria-hidden="true"></span>
        <p class="service__price">${formatPrice(service.price)}</p>
      </div>
      <p class="service__desc">${service.desc}</p>
      <div class="service__meta">
        <p class="service__duration">${formatDuration(service.minutes)}</p>
        ${tag}
      </div>
    </li>`;
}

// All services from every category in one flat array
const allServices = categories.flatMap((category) => category.services);

// Fills every element marked data-services="featured" (homepage preview)
// or data-services="<category id>" (services page).
export function renderServiceMenus() {
  for (const list of document.querySelectorAll('[data-services]')) {
    const key = list.dataset.services;

    const services =
      key === 'featured'
        ? featuredIds.map((id) => allServices.find((service) => service.id === id))
        : categories.find((category) => category.id === key)?.services;

    if (!services) {
      console.warn(`Unknown service list: "${key}"`);
      continue;
    }

    list.innerHTML = services.filter(Boolean).map(serviceItem).join('');
  }
}

// Services page: builds one section per category, plus the quick links
// to each category, inside the elements marked with these data attributes.
export function renderCategories() {
  const container = document.querySelector('[data-service-categories]');
  const nav = document.querySelector('[data-category-nav]');
  if (!container) return;

  container.innerHTML = categories
    .map(
      (category, index) => `
      <section class="menu-category" id="${category.id}" aria-labelledby="titre-${category.id}" data-reveal>
        <header class="menu-category__head">
          <p class="menu-category__num">${String(index + 1).padStart(2, '0')}</p>
          <h2 class="menu-category__title" id="titre-${category.id}">${category.title}</h2>
          <p class="menu-category__intro">${category.intro}</p>
        </header>
        <ul class="services services--single" data-services="${category.id}"></ul>
      </section>`,
    )
    .join('');

  if (nav) {
    nav.innerHTML = categories
      .map((category) => `<li><a class="menu-nav__link" href="#${category.id}">${category.title}</a></li>`)
      .join('');
  }
}

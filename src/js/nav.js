// Header behaviour: background on scroll + mobile menu open/close.

export function initNav() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  // Stop here if the page has no header (keeps the script safe on any page)
  if (!header || !toggle || !nav) return;

  const toggleLabel = toggle.querySelector('.visually-hidden');

  // 1. Give the header a solid background once the user scrolls down
  function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // 2. Open / close the mobile menu
  function setMenuOpen(isOpen) {
    nav.classList.toggle('is-open', isOpen);
    header.classList.toggle('is-menu-open', isOpen);
    document.body.classList.toggle('has-menu-open', isOpen);

    // aria-expanded tells screen readers whether the menu is open
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggleLabel.textContent = isOpen ? 'Fermer le menu' : 'Ouvrir le menu';
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    setMenuOpen(!isOpen);
  });

  // Close the menu after choosing a link
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
  });

  // Close the menu with the Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  // Close the menu if the window is resized to desktop width
  const desktop = window.matchMedia('(min-width: 56.25rem)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) setMenuOpen(false);
  });
}

// Fades elements in as they scroll into view.
// Add the attribute data-reveal to any element in the HTML to use it.

export function initReveal() {
  const elements = document.querySelectorAll('[data-reveal]');

  // IntersectionObserver calls our function when an element enters the screen
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // animate only once
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' }, // trigger slightly before fully in view
  );

  elements.forEach((element) => observer.observe(element));
}

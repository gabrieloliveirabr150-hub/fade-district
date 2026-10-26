# Fade District

Website for **Fade District**, a fictional premium barbershop in Geneva, Switzerland. Portfolio project.

- Premium urban look: black, charcoal, metallic silver, champagne-gold accents
- French-language content, prices in CHF
- Responsive (mobile and desktop)
- 3D straight razor in the hero, modelled procedurally with [Three.js](https://threejs.org/)

## Tech

- [Vite](https://vite.dev/): dev server and build tool
- Vanilla HTML, CSS and JavaScript (no framework)
- Three.js for the 3D hero

## Getting started

Requires [Node.js](https://nodejs.org/) 20.19 or newer.

```bash
npm install      # install dependencies
npm run dev      # start the dev server at http://localhost:5173
npm run build    # create the production build in dist/
npm run preview  # preview the production build locally
```

## Structure

```
index.html          Homepage
vite.config.js      Vite config (list of HTML pages)
public/             Static files copied as-is (favicon, images)
src/styles/         tokens.css (design tokens), base.css (reset, typography),
                    components.css (buttons, header, footer), home.css (homepage),
                    main.css (imports everything)
src/js/             main.js (entry point), nav.js (header + mobile menu),
                    reveal.js (scroll animations), hours.js (today's opening hours)
src/js/razor/       razor-model.js (3D model), hero-razor.js (scene, animation)
```

## Credits

Photos from [Unsplash](https://unsplash.com/) (Unsplash License): Allef Vinicius, Agustin Fernandez, Ivan Cortez, Maxim Makarov, Mitchell Orr.

## Disclaimer

Fade District is a fictional business. All content is for demonstration only.

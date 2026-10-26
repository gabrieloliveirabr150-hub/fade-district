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
services.html       Full services & prices page
vite.config.js      Vite config (list of HTML pages)
public/             Static files copied as-is (favicon, images)
src/styles/         tokens.css (design tokens), base.css (reset, typography),
                    components.css (buttons, header, footer), home.css (homepage),
                    main.css (imports everything)
src/js/             main.js (entry point), nav.js (header + mobile menu),
                    reveal.js (scroll animations), hours.js (today's opening hours)
src/js/razor/       razor-model.js (3D model), hero-razor.js (scene, animation)
src/js/services-menu.js  Builds the service lists from the data
src/data/services.js     All services and prices (single source of truth)
src/js/map.js            Click-to-load OpenStreetMap embed
src/data/location.js     Map view, marker and "confirmed" switch
```

## Interactive map

The "Nous trouver" section (`#infos` on the homepage) contains an
[OpenStreetMap](https://www.openstreetmap.org/) embed. No API key and no
extra dependency are needed: the map is a standard OpenStreetMap
`<iframe>` (`/export/embed.html`), created by `src/js/map.js`.

- **Click-to-load.** Nothing is requested from OpenStreetMap until the visitor
  clicks "Afficher la carte". The page stays fast and no third-party
  connection happens without the visitor's action.
- **Fictional location.** While `confirmed` is `false` in `src/data/location.js`,
  the map shows a wide view of central Geneva **without any marker**, a
  "Zone de démonstration — emplacement fictif" label stays over the map, and
  the "Itinéraire" button is disabled. The visitor's geolocation is never
  requested.
- **Dark style.** The bright OpenStreetMap tiles are turned into a dark,
  silver-toned map with a CSS `filter` (grayscale + invert) on the iframe.
- **Accessibility.** The iframe has a descriptive `title`, keyboard focus moves
  into the map after loading (the map's own zoom buttons and keyboard
  shortcuts work inside it), and the "demonstration" label lets clicks pass
  through.
- **Fallback.** If the browser is offline, or the map hasn't loaded after
  12 seconds, a message with a "Réessayer" button and a direct link is shown.
  A permanent link under the map ("Ouvrir la carte dans un nouvel onglet")
  covers cases a browser can't detect, such as a map blocked by an extension.

### Privacy

When a visitor clicks "Afficher la carte", their browser connects to
OpenStreetMap's servers, which receive the visitor's IP address and browser
information, as with any embedded third-party content. This is explained
next to the button. OpenStreetMap's policy:
<https://osmfoundation.org/wiki/Privacy_Policy>. The site's own privacy
notice should mention it before launch. Once a real address is confirmed,
the "Itinéraire" button opens Google Maps in a new tab, so Google also
receives data, only when the visitor clicks it.

OpenStreetMap's embed is fine for a small business site. For heavy traffic,
their [tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
recommends a dedicated tile provider.

### Replacing the fictional location

Only do this with a **verified** address.

1. Find the coordinates: search the address on
   [openstreetmap.org](https://www.openstreetmap.org/), right-click the
   building → "Show address"; the latitude and longitude appear on the left.
2. In `src/data/location.js`:
   - set `confirmed: true`,
   - set `marker: { lat: …, lon: … }` with those coordinates,
   - set `view` to the same coordinates, with `zoom: 16` for a street-level view.
3. Replace the placeholder address text `Rue de l'Exemple 00, 1204 Genève`
   (search for "Exemple") in `index.html` (location card and footer) and
   `services.html` (footer). Update the phone and email too.
4. Remove the "fictive / fictif" labels in `index.html`: the
   `section-head__lead` sentence and the badge in `#infos`, the
   `address-block__label`, and the "Emplacement fictif" badge in the map panel.
   Update the footer disclaimers in both pages.
5. Update the static fallback links (`href` of the `data-map-external` links
   in `index.html`, used only without JavaScript).
6. Run `npm run build` and check the map, the marker and the "Itinéraire" link.

Step 2 alone is enough for the map: it adds the marker, hides the
demonstration label and turns "Itinéraire" into a directions link.
Steps 3–5 update the text, which lives in the HTML.

## Credits

Photos from [Unsplash](https://unsplash.com/) (Unsplash License): Allef Vinicius, Agustin Fernandez, Ivan Cortez, Maxim Makarov, Mitchell Orr.

## Disclaimer

Fade District is a fictional business. All content is for demonstration only.

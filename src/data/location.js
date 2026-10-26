// Map settings for the "Nous trouver" section.
//
// ⚠ The business location is NOT confirmed. While `confirmed` is false:
//   - the map shows a wide view of central Geneva, with no marker,
//   - a "zone de démonstration" label stays visible over the map,
//   - the "Itinéraire" (directions) button stays disabled.
//
// To use a real, verified address: see "Replacing the fictional location"
// in README.md.

export const location = {
  confirmed: false,

  // Centre of the map view. Currently: central Geneva (the city itself,
  // not a business). Zoom: 12 = whole city, 15 = a few streets, 17 = a block.
  view: { lat: 46.2044, lon: 6.1432, zoom: 13 },

  // Exact position of the salon, shown as a marker on the map.
  // Leave as null until the address is verified.
  marker: null, // example format: { lat: 46.2, lon: 6.14 }
};

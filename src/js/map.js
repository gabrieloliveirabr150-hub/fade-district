// Click-to-load OpenStreetMap embed for the "Nous trouver" section.
// Nothing is requested from OpenStreetMap until the visitor clicks the
// button: that protects their privacy and keeps the page fast.

import { location } from '../data/location.js';

const LOAD_TIMEOUT = 12000; // ms before we assume the map failed to load

// Area to display, as a "bounding box": west, south, east, north edges.
// The higher the zoom, the smaller the box.
function boundingBox({ lat, lon, zoom }) {
  const halfWidth = (360 / 2 ** zoom) * 1.5;
  const halfHeight = halfWidth * Math.cos((lat * Math.PI) / 180) * 0.6;
  return [lon - halfWidth, lat - halfHeight, lon + halfWidth, lat + halfHeight]
    .map((value) => value.toFixed(5))
    .join(',');
}

// URL of the embeddable map. A marker is only added for a confirmed address.
function embedUrl() {
  const params = new URLSearchParams({ bbox: boundingBox(location.view), layer: 'mapnik' });
  if (location.confirmed && location.marker) {
    params.set('marker', `${location.marker.lat},${location.marker.lon}`);
  }
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}

// Same view on openstreetmap.org, opened in a new tab
function externalUrl() {
  const { lat, lon, zoom } = location.view;
  return `https://www.openstreetmap.org/#map=${zoom}/${lat}/${lon}`;
}

// Directions to the salon (official Google Maps URL format, no API key).
// Only used once the address is confirmed.
function directionsUrl({ lat, lon }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

export function initMap() {
  const map = document.querySelector('[data-map]');
  if (!map) return;

  const frame = map.querySelector('[data-map-frame]');
  const loadButton = map.querySelector('[data-map-load]');
  const retryButton = map.querySelector('[data-map-retry]');

  for (const link of document.querySelectorAll('[data-map-external]')) {
    link.href = externalUrl();
  }

  // A confirmed address turns on the marker and the directions button
  if (location.confirmed && location.marker) {
    map.classList.add('is-confirmed');
    const directions = document.querySelector('[data-directions]');
    if (directions) {
      const link = document.createElement('a');
      link.className = directions.className;
      link.href = directionsUrl(location.marker);
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Itinéraire';
      directions.replaceWith(link);
      document.querySelector('[data-directions-note]')?.remove();
    }
  }

  function loadMap() {
    map.classList.remove('is-error');
    map.classList.add('is-loading');
    frame.replaceChildren(); // removes a previous failed attempt, if any

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl();
    iframe.title = location.confirmed
      ? 'Carte OpenStreetMap : emplacement du salon Fade District'
      : 'Carte OpenStreetMap du centre de Genève, zone de démonstration (emplacement fictif)';
    iframe.loading = 'lazy';
    // The embedded page may only run its own scripts and open links in new tabs
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');

    // If the map hasn't loaded after a while (offline, blocked…), show the fallback
    const timer = setTimeout(showError, LOAD_TIMEOUT);

    iframe.addEventListener('load', () => {
      clearTimeout(timer);
      map.classList.remove('is-loading');
      map.classList.add('is-loaded');
    });

    frame.append(iframe);
    iframe.focus(); // keyboard users land directly on the map
  }

  function showError() {
    map.classList.remove('is-loading', 'is-loaded');
    map.classList.add('is-error');
    frame.replaceChildren();
    retryButton?.focus();
  }

  loadButton?.addEventListener('click', () => {
    if (!navigator.onLine) return showError();
    loadMap();
  });
  retryButton?.addEventListener('click', loadMap);
}

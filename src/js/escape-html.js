// Escapes text before it's inserted into an innerHTML template. Needed
// anywhere client-submitted text (name, phone, note…) is rendered, since
// the admin panel templates are plain template-literal HTML strings.
export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

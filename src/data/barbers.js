// Two fictional barbers for the demo, plus the "no preference" option.
// barberId 'any' is never stored on a confirmed appointment: the booking
// wizard resolves it to a real barber id before saving (see booking/slots.js).

export const barbers = [
  { id: 'karim', name: 'Karim' },
  { id: 'leo', name: 'Léo' },
];

export const anyBarberId = 'any';

export function barberName(id) {
  if (id === anyBarberId) return 'Peu importe';
  return barbers.find((barber) => barber.id === id)?.name ?? id;
}

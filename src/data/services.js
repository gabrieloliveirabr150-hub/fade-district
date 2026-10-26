// Single source of truth for services and prices.
// Change a price here and it updates on every page.
//
// Each service:
//   id        unique name, used to pick services for the homepage
//   name      displayed title
//   desc      one-sentence description
//   minutes   duration
//   price     price in CHF (a number, formatted for display elsewhere)
//   tag       optional small label, e.g. 'Signature'

export const categories = [
  {
    id: 'coupes',
    title: 'Coupes',
    intro: 'Chaque coupe commence par une consultation et se termine par un coiffage.',
    services: [
      {
        id: 'coupe-signature',
        name: 'Coupe signature',
        desc: 'Coupe aux ciseaux et à la tondeuse, adaptée à votre morphologie.',
        minutes: 45,
        price: 58,
      },
      {
        id: 'skin-fade',
        name: 'Skin fade',
        desc: 'Dégradé à blanc millimétré, contours finis au rasoir droit.',
        minutes: 50,
        price: 65,
      },
      {
        id: 'coupe-ciseaux',
        name: 'Coupe aux ciseaux',
        desc: 'Pour cheveux mi-longs à longs, travaillés entièrement aux ciseaux.',
        minutes: 60,
        price: 72,
      },
      {
        id: 'contours',
        name: 'Contours & nuque',
        desc: 'Entre deux coupes : nuque, tempes et contours redessinés au rasoir.',
        minutes: 20,
        price: 30,
      },
      {
        id: 'coupe-junior',
        name: 'Coupe junior',
        desc: 'Pour les moins de 12 ans, avec la même attention au détail.',
        minutes: 30,
        price: 40,
      },
    ],
  },
  {
    id: 'barbe',
    title: 'Barbe & rasage',
    intro: 'Serviettes chaudes, huiles et rasoir droit : le geste traditionnel, sans compromis.',
    services: [
      {
        id: 'taille-barbe',
        name: 'Taille de barbe',
        desc: 'Mise en forme, contours au rasoir, serviette chaude et huile nourrissante.',
        minutes: 30,
        price: 42,
      },
      {
        id: 'rasage-ancienne',
        name: "Rasage à l'ancienne",
        desc: 'Serviettes chaudes, mousse au blaireau, rasoir droit et soin apaisant.',
        minutes: 40,
        price: 60,
      },
      {
        id: 'contour-barbe',
        name: 'Contour de barbe',
        desc: 'Lignes des joues et du cou nettoyées au rasoir, sans toucher à la longueur.',
        minutes: 20,
        price: 28,
      },
    ],
  },
  {
    id: 'forfaits',
    title: 'Forfaits',
    intro: 'Nos prestations combinées, pensées pour prendre le temps.',
    services: [
      {
        id: 'coupe-barbe',
        name: 'Coupe & barbe',
        desc: 'Le duo complet : coupe signature et taille de barbe sculptée.',
        minutes: 75,
        price: 95,
        tag: 'Signature',
      },
      {
        id: 'rituel',
        name: 'Le Rituel Fade District',
        desc: "Skin fade, rasage à l'ancienne et soin visage, avec une boisson offerte.",
        minutes: 120,
        price: 145,
        tag: 'Expérience',
      },
    ],
  },
  {
    id: 'soins',
    title: 'Soins',
    intro: 'À ajouter à une prestation ou à réserver seuls.',
    services: [
      {
        id: 'soin-visage',
        name: 'Soin visage express',
        desc: 'Nettoyage, gommage doux et masque hydratant.',
        minutes: 20,
        price: 35,
      },
      {
        id: 'coloration-barbe',
        name: 'Coloration de barbe',
        desc: 'Camouflage des poils blancs pour un rendu naturel.',
        minutes: 30,
        price: 45,
      },
    ],
  },
];

// Services shown on the homepage preview, in this order
export const featuredIds = [
  'coupe-signature',
  'skin-fade',
  'coupe-barbe',
  'taille-barbe',
  'rasage-ancienne',
  'coupe-junior',
];

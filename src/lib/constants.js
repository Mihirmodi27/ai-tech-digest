// Categories for the digest sidebar and filtering.
// These are also stored in the DB `categories` table, but kept here
// as a client-side fallback and for fast rendering before API loads.
export const CATEGORIES = [
  'Models & Updates',
  'Products & Launches',
  'Funding & M&A',
  'Research & Papers',
  'Open Source & Tooling',
  'Infrastructure & Compute',
  'Policy & Regulation',
  'Industry Signals',
  'Vertical Watch',
  'Rumors & Unconfirmed',
];

export const TWEAK_DEFAULTS = {
  accentColor: '#3B82F6',
  fontScale: 1,
  cardSpacing: 2,
  showTags: true,
  compactCards: false,
};

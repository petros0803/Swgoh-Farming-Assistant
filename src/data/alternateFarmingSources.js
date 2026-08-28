/**
 * Shipment and event sources are not exposed by the public game-data mirror,
 * so these entries are curated from current swgoh.wiki acquisition/store pages.
 * Appearance labels are qualitative because Capital Games does not publish
 * numerical shipment odds.
 */
import { currencyIconPaths } from './currencyIcons';

/**
 * Which currency each shipment spends. Generated wiki entries only know the
 * store name, so this keeps one store from splitting into two spend plans.
 */
export const STORE_CURRENCIES = {
  'Galactic War Store': 'Galactic War Tokens',
  'Guild Activity Store': 'Guild Tokens',
  'Guild Events Store': 'Guild Event Tokens',
  'Squad Arena Store': 'Squad Arena Tokens',
  'Fleet Arena Store': 'Fleet Arena Tokens',
  'Cantina Battles Store': 'Cantina Battle Tokens',
  'Shard Store': 'Shard Currency'
};

/** Store names we curate that differ from the icon label the wiki tables use. */
const CURRENCY_ALIASES = {
  'shard currency': 'shard store tokens',
  'conquest credits': 'conquest currency',
  'legend tokens store': 'legend tokens'
};

/** Plural- and punctuation-agnostic so curated and scraped names both resolve. */
function currencyKey(currency) {
  const cleaned = currency.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return (CURRENCY_ALIASES[cleaned] ?? cleaned).replace(/s$/, '');
}

const iconPathByKey = new Map(
  Object.entries(currencyIconPaths).map(([currency, file]) => [currencyKey(currency), file])
);

/** Appearance labels that mean "do not count on this showing up". */
const RARE_APPEARANCES = new Set(['Low', 'Rare']);

export function isRareAppearance(source) {
  return RARE_APPEARANCES.has(source?.appearance) ||
    source?.offers?.some((offer) => RARE_APPEARANCES.has(offer.appearance));
}

export function storeCurrency(source) {
  return source?.currency ?? STORE_CURRENCIES[source?.label] ?? source?.label;
}

export function currencyIcon(source) {
  const currency = typeof source === 'string' ? source : storeCurrency(source);
  if (!currency) return null;
  const key = currencyKey(currency);
  // A generic name like "Guild Event Token" resolves to the lowest tier icon.
  const file = iconPathByKey.get(key) ??
    [...iconPathByKey].find(([candidate]) => candidate.endsWith(` ${key}`))?.[1];
  return file ? `${import.meta.env.BASE_URL}${file}` : null;
}

export const alternateFarmingSources = {
  TIEBOMBERIMPERIAL: [
    {
      type: 'store',
      label: 'Galactic War Store',
      currency: 'Galactic War Tokens',
      cost: 400,
      quantity: 4,
      appearance: 'Low',
      url: 'https://swgoh.wiki/wiki/Galactic_War_Store'
    }
  ],
  DENGAR: [
    {
      type: 'store',
      label: 'Guild Activity Store',
      currency: 'Guild Tokens',
      cost: 450,
      quantity: 10,
      appearance: 'Average'
    }
  ],
  LOGRAY: [
    {
      type: 'store',
      label: 'Guild Activity Store',
      currency: 'Guild Tokens',
      cost: 450,
      quantity: 10,
      appearance: 'Average'
    }
  ],
  PAPLOO: [
    {
      type: 'store',
      label: 'Galactic War Store',
      currency: 'Galactic War Tokens',
      cost: 400,
      quantity: 10,
      appearance: 'Rotating'
    },
    {
      type: 'store',
      label: 'Guild Activity Store',
      currency: 'Guild Tokens',
      cost: 450,
      quantity: 10,
      appearance: 'Average'
    }
  ],
  HANSOLO: [
    {
      type: 'store',
      label: 'Guild Activity Store',
      currency: 'Mk I Raid Tokens',
      cost: 700,
      quantity: 10,
      appearance: 'Always'
    },
    {
      type: 'event',
      label: 'The Pit raid'
    }
  ],
  RAZORCREST: [
    {
      type: 'store',
      label: 'Fleet Arena Store',
      currency: 'Fleet Arena Tokens',
      cost: 400,
      quantity: 4,
      appearance: 'Low'
    },
    {
      type: 'store',
      label: 'Guild Events Store',
      currency: 'Mk III Guild Event Tokens',
      cost: 1750,
      quantity: 5,
      appearance: 'Average'
    },
    {
      type: 'event',
      label: 'Proving Grounds'
    }
  ]
};

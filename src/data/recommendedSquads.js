/**
 * Community-recommended event squads, transcribed by hand from swgoh.wiki.
 *
 * Only events where the wiki states a squad are listed. The guides are free
 * prose that mixes the recommended squad with the enemy team, so this file is
 * curated rather than generated — see scripts/verify_recommended.mjs for the
 * check that every id below still belongs to its farm.
 *
 * Keyed by the `event` field on a farm, which is the stable identifier.
 */
export const recommendedSquads = {
  'Contact Protocol': {
    units: ['PAPLOO', 'EWOKELDER', 'WICKET', 'LOGRAY', 'CHIEFCHIRPA'],
    source: 'https://swgoh.wiki/wiki/Contact_Protocol',
    sourceLabel: "Baby Yoda's guide to the 3PO event",
    caveat: 'This guide predates Princess Kneesaa, who many players now rate above Wicket.'
  },
  'Artist of War': {
    units: ['HERASYNDULLAS3', 'KANANJARRUSS3', 'EZRABRIDGERS3', 'CHOPPERS3', 'ZEBS3'],
    source: 'https://swgoh.wiki/wiki/Artist_of_War',
    sourceLabel: 'Artist of War guides section'
  },
  "Emperor's Demise": {
    units: [
      'HERASYNDULLAS3',
      'KANANJARRUSS3',
      'EZRABRIDGERS3',
      'CHOPPERS3',
      'ZEBS3',
      'SABINEWRENS3',
      'CAPTAINREX'
    ],
    source: 'https://swgoh.wiki/wiki/Emperor%27s_Demise',
    sourceLabel: 'Emperor\'s Demise guides section',
    caveat: 'The wiki names the Phoenix faction rather than five specific units, so all seven Phoenix are marked.'
  }
};

/** Returns the recommendation for a farm, or null when nobody has published one. */
export function getRecommendedSquad(phase) {
  const entry = phase?.event ? recommendedSquads[phase.event] : null;
  if (!entry) return null;

  return {
    ids: new Set(entry.units),
    units: entry.units,
    source: entry.source,
    sourceLabel: entry.sourceLabel,
    caveat: entry.caveat ?? null
  };
}

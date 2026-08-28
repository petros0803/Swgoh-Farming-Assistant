/**
 * Character rarity gates for Relic Amplifier levels.
 *
 * EA's November 2025 title update made Relic 4 available at 5 stars,
 * Relic 5 at 6 stars, and Relic 6 the first level that requires 7 stars.
 * The resulting progression is:
 *   4 stars -> Relic 1-2
 *   5 stars -> Relic 3-4
 *   6 stars -> Relic 5
 *   7 stars -> Relic 6+
 *
 * Source:
 * https://www.ea.com/games/starwars/galaxy-of-heroes/news/title-update-and-10-year-anniversary-announcement
 */
/** Relic Amplifiers only open once a character is fully geared. */
export const GEAR_LEVEL_FOR_RELICS = 13;

export function minimumStarsForRelic(relicLevel) {
  if (relicLevel >= 6) return 7;
  if (relicLevel === 5) return 6;
  if (relicLevel >= 3) return 5;
  if (relicLevel >= 1) return 4;
  return 0;
}

/**
 * Ceiling of what one Lightspeed Token hands over outright: a 6-star, Relic 5
 * character. Tokens are earned in game, so this is a free shortcut and not the
 * paid Lightspeed Bundle offers. No token ever grants a ship, which is why ship
 * shards always have to be farmed from repeatable nodes and shipments.
 */
export const LIGHTSPEED_TOKEN_CEILING = { stars: 6, relic: 5 };

/**
 * True when a Lightspeed Token alone could satisfy this requirement, which
 * makes farming it early far less urgent than an equivalent ship.
 */
export function lightspeedTokenCovers(kind, target) {
  if (kind !== 'character') return false;

  const stars = target?.targetStars ?? 7;
  const relic = target?.targetR ?? 0;

  return stars <= LIGHTSPEED_TOKEN_CEILING.stars && relic <= LIGHTSPEED_TOKEN_CEILING.relic;
}

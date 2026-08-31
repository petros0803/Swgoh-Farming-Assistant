import { getRecommendedSquad } from './recommendedSquads';

/**
 * Journey requirements where every listed unit is interchangeable and the
 * player only needs to choose a fixed-size squad. Mixed requirements (such as
 * Clash on Kamino and Imperial Chimaera) are intentionally excluded.
 */
export const POOL_REQUIREMENTS = {
  'One Famous Wookiee': { count: 5, label: 'Bounty Hunters' },
  'Contact Protocol': { count: 5, label: 'Ewoks' },
  'Flight of the Falcon': { count: 4, label: 'Bounty Hunter ships' },
  'Aggressive Negotiations': { count: 5, label: 'Separatists' },
  'Artist of War': { count: 5, label: 'Phoenix characters' },
  'Daring Droid': { count: 5, label: 'Empire characters' },
  'Pieces and Plans': { count: 5, label: 'First Order characters' },
  "Emperor's Demise": { count: 5, label: 'Rebel characters' },
  "Grand Master's Training": { count: 5, label: 'Jedi' }
};

export function getPoolRequirement(farm) {
  return farm?.event ? POOL_REQUIREMENTS[farm.event] ?? null : null;
}

export function getFarmUnits(farm) {
  return [
    ...(farm?.characters ?? []).map((unit) => ({ ...unit, kind: 'character' })),
    ...(farm?.ships ?? []).map((unit) => ({ ...unit, kind: 'ship' }))
  ];
}

export function getDefaultPoolUnitIds(farm) {
  const requirement = getPoolRequirement(farm);
  if (!requirement) return [];

  const units = getFarmUnits(farm);
  const eligibleIds = new Set(units.map((unit) => unit.id));
  const recommended = getRecommendedSquad(farm)?.units ?? [];
  const orderedIds = [
    ...recommended.filter((id) => eligibleIds.has(id)),
    ...units.map((unit) => unit.id)
  ];

  return [...new Set(orderedIds)].slice(0, requirement.count);
}

export function sanitizePoolChoices(farm, choices) {
  const requirement = getPoolRequirement(farm);
  if (!requirement || !Array.isArray(choices)) return [];

  const eligibleIds = new Set(getFarmUnits(farm).map((unit) => unit.id));
  return [...new Set(choices)]
    .filter((id) => typeof id === 'string' && eligibleIds.has(id))
    .slice(0, requirement.count);
}

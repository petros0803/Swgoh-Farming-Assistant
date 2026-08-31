export const MY_ROADMAP_STORAGE_KEY = 'swgoh-my-roadmap';

/**
 * Version 1 stored farm keys alone. Version 2 adds the squad a player picked
 * for each "any N of a faction" event, so a v1 roadmap still loads and simply
 * falls back to the automatic squad pick.
 */
const EMPTY_ROADMAP = { farmKeys: [], poolChoices: {} };

function sanitizeFarmKeys(farmKeys) {
  if (!Array.isArray(farmKeys)) return [];
  return [...new Set(farmKeys.filter((key) => typeof key === 'string'))];
}

function sanitizePoolChoices(poolChoices) {
  if (!poolChoices || typeof poolChoices !== 'object' || Array.isArray(poolChoices)) return {};

  return Object.fromEntries(
    Object.entries(poolChoices)
      .filter(([event, ids]) => typeof event === 'string' && Array.isArray(ids))
      .map(([event, ids]) => [
        event,
        [...new Set(ids.filter((id) => typeof id === 'string'))]
      ])
  );
}

export function loadMyRoadmap(storage = window.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(MY_ROADMAP_STORAGE_KEY));
    if (!value || ![1, 2].includes(value.version)) return EMPTY_ROADMAP;

    return {
      farmKeys: sanitizeFarmKeys(value.farmKeys),
      poolChoices: value.version === 2 ? sanitizePoolChoices(value.poolChoices) : {}
    };
  } catch {
    return EMPTY_ROADMAP;
  }
}

export function saveMyRoadmap(roadmap, storage = window.localStorage) {
  try {
    storage.setItem(
      MY_ROADMAP_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        farmKeys: sanitizeFarmKeys(roadmap.farmKeys),
        poolChoices: sanitizePoolChoices(roadmap.poolChoices)
      })
    );
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
export const MY_ROADMAP_STORAGE_KEY = 'swgoh-my-roadmap';

export function loadMyRoadmapKeys(storage = window.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(MY_ROADMAP_STORAGE_KEY));
    if (!value || value.version !== 1 || !Array.isArray(value.farmKeys)) return [];
    return [...new Set(value.farmKeys.filter((key) => typeof key === 'string'))];
  } catch {
    return [];
  }
}

export function saveMyRoadmapKeys(farmKeys, storage = window.localStorage) {
  try {
    storage.setItem(
      MY_ROADMAP_STORAGE_KEY,
      JSON.stringify({ version: 1, farmKeys })
    );
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

import { getCatalog } from '../data/catalogState';

const caches = new WeakMap();

function unitCache() {
  const units = getCatalog().units;
  let cache = caches.get(units);
  if (!cache) {
    cache = {
      character: units.filter((unit) => unit.kind === 'character'),
      ship: units.filter((unit) => unit.kind === 'ship'),
      byId: new Map(units.map((unit) => [unit.id, unit]))
    };
    caches.set(units, cache);
  }
  return cache;
}

function liveArray(kind) {
  return new Proxy([], {
    get(_target, prop) {
      const list = unitCache()[kind];
      if (prop === Symbol.iterator) return list[Symbol.iterator].bind(list);
      const value = Reflect.get(list, prop, list);
      return typeof value === 'function' ? value.bind(list) : value;
    }
  });
}

function liveMap() {
  return new Proxy(new Map(), {
    get(_target, prop) {
      const map = unitCache().byId;
      if (prop === Symbol.iterator) return map[Symbol.iterator].bind(map);
      const value = Reflect.get(map, prop, map);
      return typeof value === 'function' ? value.bind(map) : value;
    }
  });
}

export const characterCatalog = liveArray('character');
export const shipCatalog = liveArray('ship');
export const unitCatalogById = liveMap();

export function unitPortrait(unitOrId) {
  const unit = typeof unitOrId === 'string' ? unitCatalogById.get(unitOrId) : unitOrId;
  return unit?.icon ? `${import.meta.env.BASE_URL}${unit.icon}` : null;
}

export function acquisitionSources(unitId) {
  return unitCatalogById.get(unitId)?.sources ?? [];
}

export function acquisitionSummary(unitId, limit = 2) {
  const sources = acquisitionSources(unitId);
  if (sources.length === 0) return 'Source not currently tracked';

  const labels = sources.slice(0, limit).map((source) => source.label);
  const remaining = sources.length - labels.length;
  return `${labels.join(' · ')}${remaining > 0 ? ` · +${remaining} more` : ''}`;
}

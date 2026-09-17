import { characterCatalog, shipCatalog, unitCatalog } from '../data/farmingSources';

export { characterCatalog, shipCatalog };

export const unitCatalogById = new Map(unitCatalog.map((unit) => [unit.id, unit]));

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

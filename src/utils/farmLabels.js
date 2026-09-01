/** The end-state a unit is farmed to, preferring relic over stars. */
export function targetLabel(unit) {
  if (unit.target?.targetR) return `R${unit.target.targetR}`;
  return `${unit.target?.targetStars ?? 7}★`;
}

/** Spells out a single event's gates, which can be stars, relic, or both. */
export function requirementLabel(target) {
  const gates = [];
  if (target?.targetStars) gates.push(`${target.targetStars}★`);
  if (target?.targetR) gates.push(`relic ${target.targetR}`);
  return gates.join(' + ') || '7★';
}

/** Leading emoji, then the kind of unlock the category spells out. */
const FARM_KIND_PREFIX = /^(\P{L}*)(?:Galactic Legend|Journey|Fleet Unlock):\s*/u;

/**
 * "🚀 Fleet Unlock: Executor" → "🚀 Executor". Rows are scanned by the unit
 * they unlock, so the kind only earns its space in the row's hover title.
 */
export function farmDisplayCategory(category = '') {
  return category.replace(FARM_KIND_PREFIX, '$1');
}

/** All Farms and the picker scan by unlock name, not Journey Guide order. */
export function sortFarmsByName(farms) {
  return [...farms].sort(
    (a, b) => a.reward.name.localeCompare(b.reward.name) || a.event.localeCompare(b.event)
  );
}

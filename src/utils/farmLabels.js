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

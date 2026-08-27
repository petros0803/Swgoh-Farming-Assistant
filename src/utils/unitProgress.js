export const MAX_STARS = 7;

export function relicLevel(unit) {
  return unit && unit.relic_tier > 2 ? unit.relic_tier - 2 : 0;
}

export function evaluateUnit(target, unit) {
  const currentStars = unit ? unit.rarity : 0;
  const currentRelic = relicLevel(unit);
  const currentGear = unit ? unit.gear_level : 0;

  let isComplete;
  let statusText;
  let progressPct;

  if (target.targetR) {
    isComplete = currentRelic >= target.targetR;
    statusText = isComplete ? 'Ready' : `Need R${target.targetR}`;
    progressPct = Math.min(100, Math.round((currentRelic / target.targetR) * 100));
  } else {
    isComplete = currentStars >= (target.targetStars || MAX_STARS);
    statusText = isComplete ? 'Ready' : `Need ${target.targetStars}★`;
    progressPct = Math.min(100, Math.round((currentStars / target.targetStars) * 100));
  }

  const statusClass = isComplete ? 'completed' : (unit ? 'in-progress' : 'not-started');

  return {
    currentStars,
    currentRelic,
    currentGear,
    isComplete,
    statusText,
    progressPct,
    statusClass,
    inRoster: Boolean(unit)
  };
}

export function percent(met, total) {
  return total > 0 ? Math.round((met / total) * 100) : 0;
}

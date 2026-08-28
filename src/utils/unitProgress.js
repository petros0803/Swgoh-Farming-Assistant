import { minimumStarsForRelic } from '../data/gameRules';

export const MAX_STARS = 7;

export function relicLevel(unit) {
  return unit && unit.relic_tier > 2 ? unit.relic_tier - 2 : 0;
}

export function evaluateUnit(target, unit) {
  const currentStars = unit ? unit.rarity : 0;
  const currentRelic = relicLevel(unit);
  const currentGear = unit ? unit.gear_level : 0;

  // Relic and star requirements are independent gates. An event can ask for a
  // star level with no relic (faction squads, ships) or a relic level, and a
  // unit is only ready when it satisfies every gate that applies to it.
  const relicTarget = target.targetR ?? 0;
  // An omitted star target means the event only named a relic level. Apply
  // the game's rarity gate for that relic instead of silently requiring 7★.
  const starTarget = target.targetStars ?? (relicTarget > 0 ? minimumStarsForRelic(relicTarget) : MAX_STARS);

  const starsMet = currentStars >= starTarget;
  const relicMet = relicTarget === 0 || currentRelic >= relicTarget;
  const isComplete = starsMet && relicMet;

  // Stars gate gear and relics, so report them as the blocker first.
  let statusText;
  if (isComplete) statusText = 'Ready';
  else if (!starsMet) statusText = `Need ${starTarget}★`;
  else statusText = `Need R${relicTarget}`;

  const starPct = Math.min(100, (currentStars / starTarget) * 100);
  const relicPct = relicTarget === 0 ? 100 : Math.min(100, (currentRelic / relicTarget) * 100);
  const progressPct = Math.round(Math.min(starPct, relicPct));

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

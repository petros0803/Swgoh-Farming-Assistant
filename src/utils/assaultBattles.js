import { currencyIconPaths } from '../data/currencyIcons';

export function filterAssaultBattles(events, query, selectedId = 'all') {
  const normalized = query.trim().toLowerCase();
  return events.filter((event) => {
    if (selectedId !== 'all' && event.id !== selectedId) return false;
    if (!normalized) return true;
    const haystack = [
      event.name,
      event.summary,
      ...event.tiers[0].gate.categories.map((category) => category.name),
      ...event.tiers[0].gate.mandatoryUnits.map((unit) => unit.name)
    ].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });
}

export function formatRewardQuantity(reward) {
  const format = (value) => Number(value).toLocaleString('en-US');
  if (reward.min === reward.max) return format(reward.max);
  if (reward.min === 0) return `Up to ${format(reward.max)}`;
  return `${format(reward.min)}–${format(reward.max)}`;
}

export function hardRequirementLabels(gate) {
  const labels = [];
  if (gate.mandatoryUnits.length > 0) {
    labels.push(`Required: ${gate.mandatoryUnits.map((unit) => unit.name).join(', ')}`);
  }
  if (gate.categories.length > 0) {
    labels.push(`Eligible: ${gate.categories.map((category) => category.name).join(' or ')}`);
  }
  if (gate.teamSize > 0) labels.push(`${gate.teamSize} units`);
  if (gate.minimumStars > 0) labels.push(`${gate.minimumStars}★ minimum`);
  if (gate.minimumLevel > 0) labels.push(`Level ${gate.minimumLevel}`);
  if (gate.minimumGear > 0) labels.push(`Gear ${gate.minimumGear}`);
  if (gate.minimumRelic > 0) labels.push(`Relic ${gate.minimumRelic}`);
  if (gate.minimumModDots > 0) labels.push(`${gate.minimumModDots}-dot mods`);
  return labels;
}

/**
 * Who may enter a tier: named units are mandatory, categories fill the
 * remaining slots, and a fully named squad makes the categories redundant.
 */
export function squadRequirement(gate) {
  const unitNames = gate.mandatoryUnits.map((unit) => unit.name);
  const categoryNames = gate.categories.map((category) => category.name);
  const squadIsFullyNamed = unitNames.length >= gate.teamSize && unitNames.length > 0;

  if (unitNames.length === 0) return { label: 'Eligible', names: categoryNames };
  if (squadIsFullyNamed) return { label: 'Units', names: unitNames };
  return { label: 'Units', names: [...categoryNames, ...unitNames] };
}

/** Label/value rows for a tier's "Requirements" column. */
export function tierRequirementRows(tier, previousTierName) {
  const { gate } = tier;
  const rows = [];
  const squad = squadRequirement(gate);

  if (previousTierName) rows.push({ label: 'Complete', value: previousTierName });
  if (squad.names.length > 0) rows.push({ label: squad.label, value: squad.names.join(', ') });
  if (gate.teamSize > 0) rows.push({ label: 'Squad', value: `${gate.teamSize} units` });
  if (gate.minimumStars > 0) rows.push({ label: 'Stars', value: `${gate.minimumStars}+` });
  if (gate.minimumLevel > 0) rows.push({ label: 'Level', value: `${gate.minimumLevel}+` });
  if (gate.minimumGear > 0) rows.push({ label: 'Gear', value: `${gate.minimumGear}+` });
  if (gate.minimumRelic > 0) rows.push({ label: 'Relic', value: `${gate.minimumRelic}+` });
  if (gate.minimumModDots > 0) {
    rows.push({ label: 'Mods', value: `${gate.minimumModDots} dots` });
  }

  return rows;
}

/** How a reward pool pays out, or null when the group is a single line. */
export function rewardRuleLabel(group) {
  if (group.rewards.length === 1) return null;
  if (group.selection.mode === 'all') return 'All of the following';
  if (group.selection.count === 1) return 'Either of the following';
  return `Any ${group.selection.count} of the following`;
}

/** Label/value rows for the escalating cost of extra daily runs. */
/** Game data names the currency in plural, the shared icon map in singular. */
export function currencyIcon(currency) {
  return currencyIconPaths[currency]
    ?? currencyIconPaths[currency.replace(/s$/, '')]
    ?? null;
}

export function refreshRows(refresh) {
  if (!refresh) return [];
  return refresh.steps.map((step) => ({
    label: step.from === step.to ? `${step.from}` : `${step.from}–${step.to}`,
    cost: step.cost.toLocaleString('en-US'),
    currency: step.currency,
    icon: currencyIcon(step.currency)
  }));
}

export function rewardIcon(kind) {
  return {
    character: '◉',
    ship: '◆',
    currency: '¤',
    relicScrap: '⬢',
    signalData: '◈',
    modSlicing: '⬡',
    mod: '⬡',
    gear: '▣',
    abilityMaterial: '✦',
    trainingDroid: '▲',
    material: '■'
  }[kind] || '■';
}

/** Compact caption for reward art the project does not ship an icon for. */
export function rewardTileLabel(reward) {
  const name = reward.name;
  const abilityMaterial = name.match(/^(?:Ship )?Ability Material (.+)$/);
  if (abilityMaterial) return abilityMaterial[1];

  const droid = name.match(/^(T\d+) (?:Training|Enhancement) Droid$/);
  if (droid) return droid[1];

  const modSet = name.match(/^(.+) mod$/);
  if (modSet) return modSet[1];

  if (/Salvage$/.test(name)) {
    return name.match(/^(Mk \d+)/)?.[1] ?? 'Gear';
  }

  return name
    .replace(/ (shards|blueprints)$/, '')
    .replace(/\([^)]*\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

export function assaultBattleStats(events, teamsByEvent) {
  return {
    events: events.length,
    tiers: events.reduce((total, event) => total + event.tiers.length, 0),
    teams: Object.values(teamsByEvent).reduce((total, teams) => total + teams.length, 0)
  };
}

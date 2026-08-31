import { assaultBattles } from '../data/assaultBattles';
import { assaultBattleTeams } from '../data/assaultBattleTeams';
import {
  filterAssaultBattles,
  formatRewardQuantity,
  hardRequirementLabels,
  refreshRows,
  rewardRuleLabel,
  rewardTileLabel,
  tierRequirementRows
} from './assaultBattles';

describe('Assault Battle data', () => {
  it('contains every recurring event and all 61 tiers', () => {
    expect(assaultBattles).toHaveLength(9);
    expect(assaultBattles.reduce((total, event) => total + event.tiers.length, 0)).toBe(61);
    expect(assaultBattles.filter((event) => event.format === 'classic'))
      .toHaveLength(7);
    expect(assaultBattles.filter((event) => event.format === 'modern'))
      .toHaveLength(2);
  });

  it('keeps fixed squads and hard relic gates explicit', () => {
    const peridea = assaultBattles.find((event) => event.name === 'Peridea Patrol');
    expect(peridea.tiers[0].gate.mandatoryUnits.map((unit) => unit.id)).toEqual([
      'CAPTAINENOCH',
      'DEATHTROOPERPERIDEA',
      'NIGHTTROOPER'
    ]);
    expect(peridea.tiers.at(-1).gate.minimumRelic).toBe(9);
    expect(hardRequirementLabels(peridea.tiers.at(-1).gate)).toContain('Relic 9');
  });

  it('has sourced recommendations without inventing extra fixed teams', () => {
    const fixedEvents = new Set([
      'NODE_EVENT_ASSAULT_DUEL_OF_THE_FATES',
      'NODE_EVENT_ASSAULT_PERIDEA_PATROL'
    ]);
    Object.entries(assaultBattleTeams).forEach(([eventId, teams]) => {
      expect(teams).toHaveLength(fixedEvents.has(eventId) ? 1 : 4);
    });
    expect(assaultBattleTeams.NODE_EVENT_ASSAULT_DUEL_OF_THE_FATES).toHaveLength(1);
    expect(assaultBattleTeams.NODE_EVENT_ASSAULT_PERIDEA_PATROL).toHaveLength(1);

    Object.values(assaultBattleTeams).flat().forEach((team) => {
      expect(team.sources.length).toBeGreaterThan(0);
      expect(team.units.length).toBeGreaterThan(0);
    });
  });

  it('ships a local Wiki icon for every displayed reward', () => {
    const rewards = assaultBattles
      .flatMap((event) => event.tiers)
      .flatMap((tier) => [
        ...tier.firstTimeRewards,
        ...tier.rewards.guaranteed,
        ...tier.rewards.groups.flatMap((group) => group.rewards)
      ]);

    expect(rewards.length).toBeGreaterThan(800);
    rewards.forEach((reward) => {
      expect(reward.icon).toMatch(/^assets\/reward-icons\/.+\.png$/);
    });
  });

  it('filters by event, faction, and selector', () => {
    expect(filterAssaultBattles(assaultBattles, 'jedi').map((event) => event.name))
      .toEqual(expect.arrayContaining(['Ground War', 'Places of Power', 'Fanatical Devotion']));
    expect(filterAssaultBattles(
      assaultBattles,
      '',
      'NODE_EVENT_ASSAULT_PERIDEA_PATROL'
    ).map((event) => event.name)).toEqual(['Peridea Patrol']);
  });

  it('labels fixed, ranged, and zero-based reward quantities accurately', () => {
    expect(formatRewardQuantity({ min: 10, max: 10 })).toBe('10');
    expect(formatRewardQuantity({ min: 10, max: 15 })).toBe('10–15');
    expect(formatRewardQuantity({ min: 0, max: 8 })).toBe('Up to 8');
  });

  it('groups reward previews into currency and item families', () => {
    const duel = assaultBattles.find((event) => event.name === 'Duel of the Fates');
    const tierFour = duel.tiers[3];

    expect(tierFour.rewards.guaranteed.map((reward) => reward.name))
      .toEqual(['Credits', 'Crystals']);
    expect(tierFour.rewards.groups.map((group) => group.label))
      .toEqual(['Relic materials', 'Signal data']);
    expect(tierFour.rewardRulesSourced).toBe(true);
  });

  it('states how each reward pool pays out', () => {
    const duel = assaultBattles.find((event) => event.name === 'Duel of the Fates');
    const groundWar = assaultBattles.find((event) => event.name === 'Ground War');

    // Wiki: Tier III lists "All of the following", Tier IV "Either of the following".
    expect(rewardRuleLabel(duel.tiers[2].rewards.groups[0])).toBe('All of the following');
    expect(rewardRuleLabel(duel.tiers[3].rewards.groups[0])).toBe('Either of the following');

    // Wiki: "Drops: 2 characters, 1 ship, all mods, Mk III Ability Material".
    const [shards, ships, ability, mods] = groundWar.tiers[0].rewards.groups;
    expect(rewardRuleLabel(shards)).toBe('Any 2 of the following');
    expect(rewardRuleLabel(ships)).toBe('Either of the following');
    expect(rewardRuleLabel(ability)).toBeNull();
    expect(rewardRuleLabel(mods)).toBe('All of the following');

    // Challenge tiers have no published sentence, so they are flagged as inferred.
    expect(groundWar.tiers.at(-1).rewardRulesSourced).toBe(false);
  });

  it('reads daily attempts and escalating refresh costs from the game data', () => {
    const forestMoon = assaultBattles.find((event) => event.name === 'Forest Moon');
    const duel = assaultBattles.find((event) => event.name === 'Duel of the Fates');

    const crystal = { currency: 'Crystals', icon: 'assets/currencies/crystal.png' };

    expect(forestMoon.tiers[0].refresh.attempts).toBe(1);
    expect(refreshRows(forestMoon.tiers[0].refresh)).toEqual([
      { label: '1–2', cost: '225', ...crystal },
      { label: '3–4', cost: '325', ...crystal },
      { label: '5–6', cost: '425', ...crystal },
      { label: '7–16', cost: '500', ...crystal }
    ]);
    expect(refreshRows(forestMoon.tiers[2].refresh)).toEqual([]);
    expect(refreshRows(duel.tiers[0].refresh))
      .toEqual([{ label: '1–2', cost: '499', ...crystal }]);
    expect(refreshRows(duel.tiers[2].refresh))
      .toEqual([{ label: '1', cost: '749', ...crystal }]);
  });

  it('separates hard tier gates from the in-game recommendations', () => {
    const duel = assaultBattles.find((event) => event.name === 'Duel of the Fates');
    const rows = tierRequirementRows(duel.tiers[1], duel.tiers[0].name);

    expect(rows[0]).toEqual({ label: 'Complete', value: 'Tier I' });
    expect(rows.find((row) => row.label === 'Units').value)
      .toContain('Master Qui-Gon');
    expect(rows.some((row) => /Gear level/.test(row.value))).toBe(false);
    expect(duel.tiers[1].recommended).toContain('Gear level 10+');
  });

  it('captions reward art the project has no icon for', () => {
    expect(rewardTileLabel({ name: 'Ability Material Zeta' })).toBe('Zeta');
    expect(rewardTileLabel({ name: 'T5 Training Droid' })).toBe('T5');
    expect(rewardTileLabel({ name: 'Speed mod' })).toBe('Speed');
    expect(rewardTileLabel({ name: 'Mk 5 A/KT Stun Gun Prototype Salvage' })).toBe('Mk 5');
    expect(rewardTileLabel({ name: 'Home One blueprints' })).toBe('HO');
  });
});

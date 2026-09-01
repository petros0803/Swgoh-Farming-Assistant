import { allFarmsRoadmap } from '../data/allFarmsRoadmap';
import { farmDisplayCategory, sortFarmsByName } from './farmLabels';

describe('farmDisplayCategory', () => {
  it('keeps the icon and the unlocked unit, dropping the kind of unlock', () => {
    expect(farmDisplayCategory('🚀 Fleet Unlock: Executor')).toBe('🚀 Executor');
    expect(farmDisplayCategory('👑 Galactic Legend: Rey')).toBe('👑 Rey');
    expect(farmDisplayCategory('⭐ Journey: BB-8 (First Order pool)'))
      .toBe('⭐ BB-8 (First Order pool)');
  });

  it('leaves a hand-written roadmap phase label alone', () => {
    expect(farmDisplayCategory('⚔️ Phase 3: Jedi Knight Luke Skywalker (JKL)'))
      .toBe('⚔️ Phase 3: Jedi Knight Luke Skywalker (JKL)');
  });
});

describe('sortFarmsByName', () => {
  it('orders farms by the character or ship they unlock', () => {
    const names = sortFarmsByName(allFarmsRoadmap).map((farm) => farm.reward.name);

    expect(names[0]).toBe('Ahsoka Tano');
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

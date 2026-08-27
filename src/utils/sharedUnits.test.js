import { shortPhaseName, buildSharedUnitMap, resolveBadge } from './sharedUnits';

describe('shortPhaseName', () => {
  it('uses parenthetical abbreviations when present', () => {
    expect(shortPhaseName('⚔️ Phase 3: Jedi Knight Luke Skywalker (JKL)')).toBe('JKL');
  });

  it('strips Galactic Legend wording', () => {
    expect(shortPhaseName('🐷 Phase 4: Galactic Legend Jabba The Hutt')).toBe('Jabba The Hutt');
  });
});

describe('shared unit badges', () => {
  const roadmap = [
    { category: 'Phase 1: Executor Fleet', characters: [{ id: 'VADER', name: 'Darth Vader' }], ships: [] },
    { category: 'Phase 3: Jedi Knight Luke Skywalker (JKL)', characters: [{ id: 'VADER', name: 'Darth Vader' }], ships: [] }
  ];

  it('labels units that appear in another phase', () => {
    const shared = buildSharedUnitMap(roadmap);
    expect(resolveBadge(roadmap[0], 'VADER', 0, shared)).toEqual({
      text: 'Also in JKL',
      className: 'tag-shared'
    });
  });
});

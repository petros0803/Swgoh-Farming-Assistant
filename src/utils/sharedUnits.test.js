import {
  abbreviatePhaseName,
  shortPhaseName,
  buildSharedUnitMap,
  resolveBadge
} from './sharedUnits';

describe('shortPhaseName', () => {
  it('uses parenthetical abbreviations when present', () => {
    expect(shortPhaseName('⚔️ Phase 3: Jedi Knight Luke Skywalker (JKL)')).toBe('JKL');
  });

  it('strips Galactic Legend wording', () => {
    expect(shortPhaseName('🐷 Phase 4: Galactic Legend Jabba The Hutt')).toBe('Jabba The Hutt');
  });
});

describe('abbreviatePhaseName', () => {
  it('uses community shorthand for long names', () => {
    expect(abbreviatePhaseName('Commander Luke Skywalker')).toBe('CLS');
    expect(abbreviatePhaseName('Jedi Knight Luke Skywalker')).toBe('JKLS');
    expect(abbreviatePhaseName('Supreme Leader Kylo Ren')).toBe('SLKR');
  });

  it('leaves short names untouched', () => {
    expect(abbreviatePhaseName('Leia Organa')).toBe('Leia Organa');
    expect(abbreviatePhaseName('Rey')).toBe('Rey');
  });

  it('falls back to initials for unmapped long names', () => {
    expect(abbreviatePhaseName('Some Very Long Unit Name')).toBe('SVLUN');
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
      className: 'tag-shared',
      farms: ['Phase 3: Jedi Knight Luke Skywalker (JKL)']
    });
  });

  it('abbreviates the tag but keeps full farm names for the tooltip', () => {
    const farms = [
      { category: '⭐ Journey: Commander Luke Skywalker', characters: [{ id: 'VADER' }], ships: [] },
      { category: '👑 Galactic Legend: Leia Organa', characters: [{ id: 'VADER' }], ships: [] },
      { category: '👑 Galactic Legend: Jabba the Hutt', characters: [{ id: 'VADER' }], ships: [] }
    ];
    const shared = buildSharedUnitMap(farms);
    const badge = resolveBadge(farms[1], 'VADER', 1, shared);

    expect(badge.text).toBe('Also in CLS +1');
    expect(badge.farms).toEqual([
      '⭐ Journey: Commander Luke Skywalker',
      '👑 Galactic Legend: Jabba the Hutt'
    ]);
  });
});

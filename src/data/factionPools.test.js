import { bountyHunterShipIds, isBountyHunterFleet } from './factionPools';

describe('bountyHunterShipIds', () => {
  it('reads the Bounty Hunter fleet from the catalog', () => {
    // Guards against a renamed or restructured catalog entry silently emptying
    // the set, which would quietly drop the Executor fleet priority.
    expect([...bountyHunterShipIds].sort()).toEqual([
      'HOUNDSTOOTH',
      'IG2000',
      'PUNISHINGONE',
      'RAZORCREST',
      'SLAVE1',
      'XANADUBLOOD'
    ]);
  });
});

describe('isBountyHunterFleet', () => {
  it('only matches ships', () => {
    expect(isBountyHunterFleet('ship', 'SLAVE1')).toBe(true);
    expect(isBountyHunterFleet('ship', 'TIEBOMBERIMPERIAL')).toBe(false);
    // Boba Fett is a Bounty Hunter character, not part of the fleet lane.
    expect(isBountyHunterFleet('character', 'BOBAFETT')).toBe(false);
  });
});

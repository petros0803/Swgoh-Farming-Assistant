import { allFarmsRoadmap } from '../data/allFarmsRoadmap';
import { farmingRoadmap } from '../data/farmingRoadmap';
import { buildFarmingGuide } from './farmingGuide';

describe('buildFarmingGuide', () => {
  const emptyRoster = { data: { name: 'Test' }, units: [] };

  it('expands the recommended roadmap into its prerequisite events', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const events = new Set(guide.farms.map((farm) => farm.event));

    [
      'Discarded Doctrine',
      'Rebel with a cause',
      'Contact Protocol',
      'Luke Skywalker The Journey Continues',
      'Greetings, Exalted One',
      "Luke Skywalker Hero's Journey",
      'Daring Droid',
      'One Famous Wookiee',
      'Flight of the Falcon'
    ].forEach((event) => expect(events.has(event)).toBe(true));
  });

  it('puts prerequisite events before the events that consume their rewards', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const order = guide.farms.map((farm) => farm.event);

    expect(order.indexOf('Daring Droid')).toBeLessThan(
      order.indexOf("Luke Skywalker Hero's Journey")
    );
    expect(order.indexOf("Luke Skywalker Hero's Journey")).toBeLessThan(
      order.indexOf('Luke Skywalker The Journey Continues')
    );
    expect(order.indexOf('Luke Skywalker The Journey Continues')).toBeLessThan(
      order.indexOf('Greetings, Exalted One')
    );
  });

  it('splits the plan into independent resources that can be farmed together', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const track = (id) => guide.farmingTracks.find((candidate) => candidate.id === id);

    expect(track('hard-node').entries.some(({ unit }) => unit.id === 'HOUNDSTOOTH')).toBe(true);
    expect(track('fleet-node').entries.some(({ unit }) => unit.id === 'OUTRIDER')).toBe(true);
    expect(track('cantina-node').entries.some(({ unit }) => unit.id === 'CHIEFCHIRPA')).toBe(true);
    expect(
      track('store:Fleet Arena Store').entries.some(({ unit }) => unit.id === 'RAZORCREST')
    ).toBe(true);

    guide.farmingTracks.forEach(({ entries }) => {
      const goalRanks = entries.map(({ unit }) => unit.goalRank);
      expect(goalRanks).toEqual([...goalRanks].sort((a, b) => a - b));
    });
  });

  it('opens the fleet phase with the Executor Bounty Hunter ships', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const ships = guide.queue.filter((unit) => unit.kind === 'ship');
    const leading = ships.slice(0, 4);

    expect(leading.every((ship) => ship.bountyHunterFleet)).toBe(true);
    expect(leading.every((ship) => ship.goalEvent === 'Discarded Doctrine')).toBe(true);
    expect(leading.map((ship) => ship.id).sort()).toEqual(
      ['HOUNDSTOOTH', 'IG2000', 'RAZORCREST', 'SLAVE1']
    );

    // Executor's Empire ships follow, and later goals' ships come after those.
    expect(ships[4].goalEvent).toBe('Discarded Doctrine');
    expect(ships.at(-1).id).toBe('OUTRIDER');
  });

  it('reports event rewards as unlocks instead of farms', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const unlockIds = guide.eventUnlocks.map((unit) => unit.id);

    // The Falcon arrives from the Bounty Hunter fleet the queue already farms
    // for Executor, so it never competes for a farming slot of its own.
    expect(unlockIds).toContain('MILLENNIUMFALCON');
    expect(guide.unitById.get('MILLENNIUMFALCON').unlockEvent).toBe('Flight of the Falcon');
    expect(unlockIds).toEqual(
      expect.arrayContaining([
        'R2D2_LEGENDARY',
        'COMMANDERLUKESKYWALKER',
        'C3POLEGENDARY',
        'CHEWBACCALEGENDARY',
        'JEDIKNIGHTLUKE'
      ])
    );

    // Nothing with a node or shipment source is treated as an unlock, and no
    // unlock is left sitting in the farming order.
    expect(unlockIds).not.toContain('HOUNDSTOOTH');
    expect(guide.queue.every((unit) => !unit.unlockEvent)).toBe(true);

    // Readiness still counts the whole plan, farms and unlocks together.
    expect(guide.totalCount).toBe(guide.queue.length + guide.eventUnlocks.length);
  });

  it('leaves the critical path on the requirements, not on the unlock', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);

    expect(guide.unitById.get('MILLENNIUMFALCON').criticalFor).toEqual([]);
    expect(guide.unitById.get('RAZORCREST').criticalFor).toContain('Flight of the Falcon');
  });

  it('keeps each phase in roadmap goal order', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const position = (id) => guide.queue.findIndex((unit) => unit.id === id);

    // Executor is the first roadmap goal, so its fleet outranks Jabba's roster.
    expect(position('TIEBOMBERIMPERIAL')).toBeLessThan(position('GAMORREANGUARD'));
    expect(position('TIEBOMBERIMPERIAL')).toBeLessThan(position('GREEDO'));

    ['ship', 'character', 'token'].forEach((lane) => {
      const goalRanks = guide.queue
        .filter((unit) => unit.lane === lane)
        .map((unit) => unit.goalRank);

      expect(goalRanks.length).toBeGreaterThan(0);
      expect(goalRanks).toEqual([...goalRanks].sort((a, b) => a - b));
    });
  });

  it('defers characters a Lightspeed Token could hand over', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const position = (id) => guide.queue.findIndex((unit) => unit.id === id);

    // Krrsantan stops at 6★ Relic 5, so a token covers him. Fennec Shand needs
    // Relic 7 and has to be farmed either way.
    expect(guide.unitById.get('KRRSANTAN').lane).toBe('token');
    expect(guide.unitById.get('FENNECSHAND').lane).toBe('character');
    expect(position('FENNECSHAND')).toBeLessThan(position('KRRSANTAN'));

    // Dengar also stops at Relic 5 for Executor, but the Chewbacca journey
    // wants seven stars, so no token finishes him.
    expect(guide.unitById.get('DENGAR').lane).toBe('character');

    // Ships never qualify, however low the requirement.
    expect(guide.queue.every((unit) => unit.kind !== 'ship' || unit.lane === 'ship')).toBe(true);
  });

  it('marks the slowest requirement in each open farm as its critical path', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);

    expect(guide.unitById.get('RAZORCREST').criticalFor).toContain('Discarded Doctrine');
    expect(guide.queue.indexOf(guide.unitById.get('RAZORCREST'))).toBeLessThan(
      guide.queue.indexOf(guide.unitById.get('DENGAR'))
    );
  });

  it('lists a unit in both its energy track and its shipment track', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const inTrack = (id, unitId) =>
      guide.farmingTracks
        .find((track) => track.id === id)
        ?.entries.some((entry) => entry.unit.id === unitId) ?? false;

    // Buying blueprints accelerates the node farm rather than replacing it.
    expect(inTrack('hard-node', 'TIEBOMBERIMPERIAL')).toBe(true);
    expect(inTrack('store:Galactic War Store', 'TIEBOMBERIMPERIAL')).toBe(true);

    // Each track only advertises the sources that spend its own resource.
    const storeEntry = guide.farmingTracks
      .find((track) => track.id === 'store:Galactic War Store')
      .entries.find((entry) => entry.unit.id === 'TIEBOMBERIMPERIAL');
    expect(storeEntry.sources.every((source) => source.type === 'store')).toBe(true);
  });

  it('keeps a unit full source list reachable from any track it appears in', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const nodeEntry = guide.farmingTracks
      .find((track) => track.id === 'hard-node')
      .entries.find((entry) => entry.unit.id === 'TIEBOMBERIMPERIAL');

    // The node card shows only the node, but the shipment stays discoverable
    // through the unit so the card can cross-reference it.
    expect(nodeEntry.sources.map((source) => source.label)).toEqual(['Dark Side 5-A']);
    expect(nodeEntry.unit.acquisition.sources.map((source) => source.label)).toEqual(
      expect.arrayContaining(['Dark Side 5-A', 'Galactic War Store'])
    );
  });

  it('keeps one store as a single budget regardless of currency naming', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const storeTracks = guide.farmingTracks.filter((track) => track.id.startsWith('store:'));
    const labels = storeTracks.map((track) => track.label);

    // Curated entries name a currency tier while generated ones know only the
    // store, so grouping on the store keeps them from splitting in two.
    expect(new Set(labels).size).toBe(labels.length);
    labels.forEach((label) => expect(label).toMatch(/Store$/));
  });

  it('stops asking for shards once a unit already owns the required stars', () => {
    // Seven stars but no relics. Leia still wants relic 7, so he stays open —
    // yet no node or shipment can deliver a relic.
    const guide = buildFarmingGuide(
      {
        data: { name: 'Test' },
        units: [
          { data: { base_id: 'SCOUTTROOPER_V3', rarity: 7, relic_tier: 2, gear_level: 12 } }
        ]
      },
      farmingRoadmap
    );
    const scout = guide.unitById.get('SCOUTTROOPER_V3');

    expect(scout.progress.isComplete).toBe(false);
    expect(scout.progress.statusText).toBe('Need R7');
    expect(scout.acquisition.remainingShards).toBe(0);

    expect(
      guide.farmingTracks.some(({ entries }) =>
        entries.some(({ unit }) => unit.id === 'SCOUTTROOPER_V3')
      )
    ).toBe(false);
    expect(guide.gearWork.map((unit) => unit.id)).toContain('SCOUTTROOPER_V3');

    // A unit that genuinely owes shards is unaffected.
    expect(
      guide.farmingTracks.some(({ entries }) =>
        entries.some(({ unit }) => unit.id === 'HOUNDSTOOTH')
      )
    ).toBe(true);
    expect(guide.gearWork.map((unit) => unit.id)).not.toContain('HOUNDSTOOTH');
  });

  it('keeps a partially starred unit in its energy track', () => {
    const guide = buildFarmingGuide(
      {
        data: { name: 'Test' },
        units: [
          { data: { base_id: 'SCOUTTROOPER_V3', rarity: 5, relic_tier: 2, gear_level: 11 } }
        ]
      },
      farmingRoadmap
    );

    expect(guide.unitById.get('SCOUTTROOPER_V3').acquisition.remainingShards).toBeGreaterThan(0);
    expect(guide.gearWork.map((unit) => unit.id)).not.toContain('SCOUTTROOPER_V3');
    expect(
      guide.farmingTracks.some(({ entries }) =>
        entries.some(({ unit }) => unit.id === 'SCOUTTROOPER_V3')
      )
    ).toBe(true);
  });

  it('selects only the required squad size from open faction pools', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);

    expect(guide.farmByEvent.get('Contact Protocol').selectedIds.size).toBe(5);
    expect(guide.farmByEvent.get('Contact Protocol').selectedIds.has('PAPLOO')).toBe(true);
    expect(guide.farmByEvent.get('Daring Droid').selectedIds.size).toBe(5);
    expect(guide.farmByEvent.get('One Famous Wookiee').selectedIds.size).toBe(5);
    expect(guide.farmByEvent.get('Flight of the Falcon').selectedIds.size).toBe(4);
  });

  it('uses roster progress when choosing between otherwise equal pool alternatives', () => {
    const playerData = {
      data: { name: 'Test' },
      units: [
        { data: { base_id: 'PAPLOO', rarity: 7, relic_tier: 2, gear_level: 12 } }
      ]
    };
    const guide = buildFarmingGuide(playerData, farmingRoadmap);

    expect(guide.farmByEvent.get('Contact Protocol').selectedIds.has('PAPLOO')).toBe(true);
  });

  it('deduplicates shared units and records every consuming event', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const vader = guide.unitById.get('VADER');

    expect(guide.queue.filter((unit) => unit.id === 'VADER')).toHaveLength(1);
    expect(vader.neededFor).toEqual(expect.arrayContaining([
      'Discarded Doctrine',
      'Luke Skywalker The Journey Continues',
      'Daring Droid'
    ]));
  });

  it('keeps an unlocked journey on the map but treats it as complete', () => {
    const withR2 = {
      data: { name: 'Test' },
      units: [{ data: { base_id: 'R2D2_LEGENDARY', rarity: 7, relic_tier: 2, gear_level: 13 } }]
    };
    const guide = buildFarmingGuide(withR2, farmingRoadmap);
    const daringDroid = guide.farmByEvent.get('Daring Droid');

    // Still present, so the dependency chain stays visible by default.
    expect(daringDroid).toBeDefined();
    expect(daringDroid.rewardOwned).toBe(true);
    expect(daringDroid.isComplete).toBe(true);
    expect(guide.completedFarmCount).toBeGreaterThan(0);

    // R2-D2 is still tracked as a Leia requirement that needs relics.
    expect(guide.unitById.get('R2D2_LEGENDARY').target.targetR).toBe(8);
    expect(guide.unitById.get('R2D2_LEGENDARY').progress.isComplete).toBe(false);

    // Its Empire squad is not farming work any more.
    expect(guide.queue.some((unit) => unit.id === 'GRANDADMIRALTHRAWN')).toBe(false);
  });

  it('flags an unlocked reward that still misses a later star requirement', () => {
    const guide = buildFarmingGuide(
      {
        data: { name: 'Test' },
        units: [
          { data: { base_id: 'MILLENNIUMFALCON', rarity: 6, relic_tier: 0, gear_level: 1 } }
        ]
      },
      farmingRoadmap
    );
    const falconJourney = guide.farmByEvent.get('Flight of the Falcon');

    expect(falconJourney.rewardOwned).toBe(true);
    expect(falconJourney.rewardShortfall).toBe('Need 7★');

    // JKL still needs the seventh star, but more stars come from re-running the
    // fleet event, so it is tracked as an unlock rather than a shard farm.
    expect(guide.unitById.get('MILLENNIUMFALCON').progress.isComplete).toBe(false);
    expect(guide.queue.some((unit) => unit.id === 'MILLENNIUMFALCON')).toBe(false);
    expect(guide.eventUnlocks.some((unit) => unit.id === 'MILLENNIUMFALCON')).toBe(true);

    // The event is the shard source, so it cannot be finished business yet.
    expect(falconJourney.isComplete).toBe(false);
    expect(falconJourney.rewardRerun).toEqual({ currentStars: 6, targetStars: 7 });
  });

  it('keeps a journey open when its unlocked reward is short of the star gate', () => {
    const jabba = allFarmsRoadmap.find((farm) => farm.event === 'Greetings, Exalted One');
    // Jabba wants C-3PO at relic 7. A gear 13, relic 0, six-star C-3PO is
    // unlocked but still owes a seventh star, which only the event grants.
    const guide = buildFarmingGuide(
      {
        data: { name: 'Test' },
        units: [{ data: { base_id: 'C3POLEGENDARY', rarity: 6, relic_tier: 2, gear_level: 13 } }]
      },
      [jabba]
    );
    const contactProtocol = guide.farmByEvent.get('Contact Protocol');

    expect(contactProtocol.rewardOwned).toBe(true);
    expect(contactProtocol.isComplete).toBe(false);
    expect(contactProtocol.rewardShortfall).toBe('Need 7★');
    expect(contactProtocol.rewardRerun).toEqual({ currentStars: 6, targetStars: 7 });

    // The Ewok squad is real work again: the event has to be run to finish it.
    const ewoks = guide.queue.filter((unit) => unit.neededFor.includes('Contact Protocol'));
    expect(ewoks).toHaveLength(5);
    expect(guide.eventUnlocks.some((unit) => unit.id === 'C3POLEGENDARY')).toBe(true);
  });

  it('treats a relic-only shortfall as a finished journey', () => {
    // Seven stars satisfies the event; Leia's relic 8 does not come from it.
    const guide = buildFarmingGuide(
      {
        data: { name: 'Test' },
        units: [{ data: { base_id: 'R2D2_LEGENDARY', rarity: 7, relic_tier: 2, gear_level: 13 } }]
      },
      farmingRoadmap
    );
    const daringDroid = guide.farmByEvent.get('Daring Droid');

    expect(daringDroid.isComplete).toBe(true);
    expect(daringDroid.rewardRerun).toBeNull();
    expect(daringDroid.rewardShortfall).toBe('Need R8');
    // Thrawn is farmed for this event alone, so nothing keeps him on the plan.
    expect(guide.queue.some((unit) => unit.id === 'GRANDADMIRALTHRAWN')).toBe(false);
  });

  it('calls a re-run event ready once its squad meets the gate again', () => {
    const jabba = allFarmsRoadmap.find((farm) => farm.event === 'Greetings, Exalted One');
    const guide = buildFarmingGuide(
      {
        data: { name: 'Test' },
        units: [
          { data: { base_id: 'C3POLEGENDARY', rarity: 6, relic_tier: 2, gear_level: 13 } },
          ...['PAPLOO', 'EWOKELDER', 'WICKET', 'LOGRAY', 'CHIEFCHIRPA'].map((id) => ({
            data: { base_id: id, rarity: 7, relic_tier: 0, gear_level: 12 }
          }))
        ]
      },
      [jabba]
    );
    const farm = guide.farmByEvent.get('Contact Protocol');

    expect(farm.readyCount).toBe(5);
    expect(farm.readyToRun).toBe(true);
    expect(farm.isComplete).toBe(false);
  });

  it('will not count a relic-3 C-3PO as ready for JKL below seven stars', () => {
    const sixStar = {
      data: { name: 'Test' },
      // Relic 3 (relic_tier 5) but only six stars.
      units: [{ data: { base_id: 'C3POLEGENDARY', rarity: 6, relic_tier: 5, gear_level: 13 } }]
    };
    const guide = buildFarmingGuide(sixStar, farmingRoadmap);
    const jkl = guide.farmByEvent.get('Luke Skywalker The Journey Continues');
    const c3po = jkl.units.find((unit) => unit.id === 'C3POLEGENDARY');

    // The JKL row itself asks for relic 3 and seven stars.
    expect(c3po.targetR).toBe(3);
    expect(c3po.targetStars).toBe(7);

    expect(guide.unitById.get('C3POLEGENDARY').progress.isComplete).toBe(false);
    expect(guide.unitById.get('C3POLEGENDARY').progress.statusText).toBe('Need 7★');
    expect(guide.eventUnlocks.some((unit) => unit.id === 'C3POLEGENDARY')).toBe(true);

    // The seventh star arriving is what flips it.
    const sevenStar = buildFarmingGuide(
      {
        data: { name: 'Test' },
        units: [{ data: { base_id: 'C3POLEGENDARY', rarity: 7, relic_tier: 5, gear_level: 13 } }]
      },
      farmingRoadmap
    );
    expect(sevenStar.unitById.get('C3POLEGENDARY').progress.statusText).toBe('Need R7');
  });

  it('judges each event row against that event own requirement', () => {
    // Seven stars, no relics. Enough for the C-3PO event, short for Leia.
    const guide = buildFarmingGuide(
      {
        data: { name: 'Test' },
        units: [
          { data: { base_id: 'PRINCESSKNEESAA', rarity: 7, relic_tier: 2, gear_level: 12 } }
        ]
      },
      farmingRoadmap
    );

    const kneesaaInC3po = guide.farmByEvent
      .get('Contact Protocol').units.find((unit) => unit.id === 'PRINCESSKNEESAA');
    const kneesaaInLeia = guide.farmByEvent
      .get('Rebel with a cause').units.find((unit) => unit.id === 'PRINCESSKNEESAA');

    expect(kneesaaInC3po.progress.isComplete).toBe(true);
    expect(kneesaaInLeia.progress.isComplete).toBe(false);
    expect(kneesaaInLeia.progress.statusText).toBe('Need R7');
  });

  it('merges relic and star gates from different farms independently', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);
    const chirpa = guide.unitById.get('CHIEFCHIRPA');

    // Relic 3 comes from Leia, the seven stars from the C-3PO event.
    expect(chirpa.target.targetR).toBe(3);
    expect(chirpa.target.targetStars).toBe(7);
  });

  it('keeps an unowned journey open even when its squad is ready', () => {
    const guide = buildFarmingGuide(
      { data: { name: 'Test' }, units: [] },
      farmingRoadmap
    );

    expect(guide.farmByEvent.get('Daring Droid').isComplete).toBe(false);
    expect(guide.farmByEvent.get('Flight of the Falcon')).toBeDefined();
    expect(guide.completedFarmCount).toBe(0);
  });

  it('does not call an event complete while the reward is unowned', () => {
    const ewoks = [...buildFarmingGuide(emptyRoster, farmingRoadmap)
      .farmByEvent.get('Contact Protocol').selectedIds];
    const playerData = {
      data: { name: 'Test' },
      units: ewoks.map((id) => ({
        data: { base_id: id, rarity: 7, relic_tier: 2, gear_level: 12 }
      }))
    };
    const guide = buildFarmingGuide(playerData, farmingRoadmap);
    const contactProtocol = guide.farmByEvent.get('Contact Protocol');

    expect(contactProtocol.readyToRun).toBe(true);
    expect(contactProtocol.isComplete).toBe(false);
    expect(guide.completedFarmCount).toBe(0);
  });

  it('marks a farm complete only when every selected unit meets that farm target', () => {
    const chosen = [
      ...buildFarmingGuide(emptyRoster, farmingRoadmap)
        .farmByEvent.get('Contact Protocol').selectedIds
    ];
    const playerData = {
      data: { name: 'Test' },
      units: [...chosen, 'C3POLEGENDARY'].map((id) => ({
        data: { base_id: id, rarity: 7, relic_tier: 2, gear_level: 12 }
      }))
    };
    const guide = buildFarmingGuide(playerData, farmingRoadmap);
    const contactProtocol = guide.farmByEvent.get('Contact Protocol');

    expect(contactProtocol.rewardOwned).toBe(true);
    expect(contactProtocol.isComplete).toBe(true);
    expect(contactProtocol.readyCount).toBe(5);
    expect(guide.completedFarmCount).toBe(1);

    // A later farm wanting more relics must not reopen a finished event.
    expect(guide.unitById.get('CHIEFCHIRPA').progress.isComplete).toBe(false);
  });

  it('reports no completed farms for an empty roster', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);

    expect(guide.completedFarmCount).toBe(0);
    expect(guide.farms.every((farm) => !farm.isComplete)).toBe(true);
  });

  it('keeps roadmap end-state targets but does not overgear faction-pool squads', () => {
    const guide = buildFarmingGuide(emptyRoster, farmingRoadmap);

    // The generated Executor event permits lower-star entry for some ships,
    // while the Recommended Roadmap intentionally takes them to seven stars.
    expect(guide.unitById.get('RAZORCREST').target.targetStars).toBe(7);

    // Contact Protocol itself only needs stars. Chirpa's R3 comes from Leia,
    // not the hand-maintained pool phase's broad R7 placeholder.
    expect(guide.unitById.get('CHIEFCHIRPA').target.targetR).toBe(3);
  });
});


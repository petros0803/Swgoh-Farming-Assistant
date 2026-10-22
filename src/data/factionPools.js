import { getCatalog } from './catalogState';

// Han's Millennium Falcon is an open Bounty Hunter fleet event, so its generated
// entry lists every eligible Bounty Hunter ship. Reading the set from there
// keeps it in step with the catalog instead of duplicating the roster by hand.
const BOUNTY_HUNTER_FLEET_EVENT = 'Flight of the Falcon';
const fleetSets = new WeakMap();

function currentBountyHunterShipIds() {
  const farms = getCatalog().farms;
  let ids = fleetSets.get(farms);
  if (!ids) {
    const ships = farms.find((farm) => farm.event === BOUNTY_HUNTER_FLEET_EVENT)?.ships ?? [];
    ids = new Set(ships.map((ship) => ship.id));
    fleetSets.set(farms, ids);
  }
  return ids;
}

export const bountyHunterShipIds = new Proxy(new Set(), {
  get(_target, prop) {
    const ids = currentBountyHunterShipIds();
    if (prop === Symbol.iterator) return ids[Symbol.iterator].bind(ids);
    const value = Reflect.get(ids, prop, ids);
    return typeof value === 'function' ? value.bind(ids) : value;
  }
});

/**
 * The Bounty Hunter fleet is the core of the Executor fleet and of the Falcon
 * fleet event, and its shards only come from fleet nodes and shipments, so it
 * is the longest running commitment on any roadmap that touches Executor.
 */
export function isBountyHunterFleet(kind, unitId) {
  return kind === 'ship' && currentBountyHunterShipIds().has(unitId);
}

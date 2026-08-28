import { allFarmsRoadmap } from './allFarmsRoadmap';

// Han's Millennium Falcon is an open Bounty Hunter fleet event, so its generated
// entry lists every eligible Bounty Hunter ship. Reading the set from there
// keeps it in step with the catalog instead of duplicating the roster by hand.
const BOUNTY_HUNTER_FLEET_EVENT = 'Flight of the Falcon';

export const bountyHunterShipIds = new Set(
  (allFarmsRoadmap.find((farm) => farm.event === BOUNTY_HUNTER_FLEET_EVENT)?.ships ?? []).map(
    (ship) => ship.id
  )
);

/**
 * The Bounty Hunter fleet is the core of the Executor fleet and of the Falcon
 * fleet event, and its shards only come from fleet nodes and shipments, so it
 * is the longest running commitment on any roadmap that touches Executor.
 */
export function isBountyHunterFleet(kind, unitId) {
  return kind === 'ship' && bountyHunterShipIds.has(unitId);
}

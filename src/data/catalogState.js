import { alternateFarmingSources, replaceCurrencyIconPaths, replaceStoreCurrencies, STORE_CURRENCIES } from './alternateFarmingSources';
import { allFarmsRoadmap } from './allFarmsRoadmap';
import { assaultBattleTeams } from './assaultBattleTeams';
import { assaultBattles } from './assaultBattles';
import { currencyIconPaths } from './currencyIcons';
import { FARMING_SOURCE_META, unitCatalog } from './farmingSources';
import { farmingRoadmap } from './farmingRoadmap';
import { GEAR_LEVEL_FOR_RELICS, LIGHTSPEED_TOKEN_CEILING, replaceCatalogRules } from './gameRules';
import { POOL_REQUIREMENTS, replacePoolRequirements } from './poolRequirements';
import { recommendedSquads, replaceRecommendedSquads } from './recommendedSquads';
import { MAX_RELIC_LEVEL, RELIC_COST_BY_LEVEL, RELIC_MATERIALS } from './relicMaterials';

function createBundledCatalog() {
  return {
    source: 'bundled',
    units: unitCatalog,
    farmingSourceMeta: FARMING_SOURCE_META,
    priorityFarms: farmingRoadmap,
    farms: allFarmsRoadmap,
    relicMaterials: RELIC_MATERIALS,
    relicCostByLevel: RELIC_COST_BY_LEVEL,
    maxRelicLevel: MAX_RELIC_LEVEL,
    assaultBattles,
    assaultBattleTeams,
    recommendedSquads,
    alternateFarmingSources,
    storeCurrencies: STORE_CURRENCIES,
    poolRequirements: POOL_REQUIREMENTS,
    currencyIconPaths,
    gearLevelForRelics: GEAR_LEVEL_FOR_RELICS,
    lightspeedTokenCeiling: LIGHTSPEED_TOKEN_CEILING
  };
}

let bundled = null;
let active = null;

function bundledCatalog() {
  if (!bundled) bundled = createBundledCatalog();
  return bundled;
}

export function getCatalog() {
  if (!active) active = bundledCatalog();
  return active;
}

export function installCatalog(snapshot) {
  if (!snapshot?.units || !snapshot.farms || !snapshot.priorityFarms) {
    throw new Error('Incomplete game catalog');
  }

  active = snapshot;
  replaceCatalogRules({
    gearLevelForRelics: snapshot.gearLevelForRelics,
    lightspeedTokenCeiling: snapshot.lightspeedTokenCeiling
  });
  replacePoolRequirements(snapshot.poolRequirements);
  replaceRecommendedSquads(snapshot.recommendedSquads);
  replaceStoreCurrencies(snapshot.storeCurrencies);
  replaceCurrencyIconPaths(snapshot.currencyIconPaths);
}

export function resetCatalog() {
  installCatalog(bundledCatalog());
}

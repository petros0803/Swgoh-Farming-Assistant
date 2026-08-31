const ICON_PATH = `${import.meta.env.BASE_URL}assets/relic-materials/`;

export const MAX_RELIC_LEVEL = 10;

export const RELIC_MATERIALS = [
  { id: 'credits', name: 'Credits', icon: `${ICON_PATH}credits.png`, group: 'currency' },
  { id: 'carboniteCircuitBoard', name: 'Carbonite Circuit Board', icon: `${ICON_PATH}carbonite-circuit-board.png`, group: 'scrap' },
  { id: 'bronziumWiring', name: 'Bronzium Wiring', icon: `${ICON_PATH}bronzium-wiring.png`, group: 'scrap' },
  { id: 'chromiumTransistor', name: 'Chromium Transistor', icon: `${ICON_PATH}chromium-transistor.png`, group: 'scrap' },
  { id: 'aurodiumHeatsink', name: 'Aurodium Heatsink', icon: `${ICON_PATH}aurodium-heatsink.png`, group: 'scrap' },
  { id: 'electriumConductor', name: 'Electrium Conductor', icon: `${ICON_PATH}electrium-conductor.png`, group: 'scrap' },
  { id: 'zinbiddleCard', name: 'Zinbiddle Card', icon: `${ICON_PATH}zinbiddle-card.png`, group: 'scrap' },
  { id: 'impulseDetector', name: 'Impulse Detector', icon: `${ICON_PATH}impulse-detector.png`, group: 'scrap' },
  { id: 'aeromagnifier', name: 'Aeromagnifier', icon: `${ICON_PATH}aeromagnifier.png`, group: 'scrap' },
  { id: 'gyrdaKeypad', name: 'Gyrda Keypad', icon: `${ICON_PATH}gyrda-keypad.png`, group: 'scrap' },
  { id: 'droidBrain', name: 'Droid Brain', icon: `${ICON_PATH}droid-brain.png`, group: 'scrap' },
  { id: 'coaxialServomotor', name: 'Coaxial Servomotor', icon: `${ICON_PATH}coaxial-servomotor.png`, group: 'scrap' },
  { id: 'fragmentedSignalData', name: 'Fragmented Signal Data', icon: `${ICON_PATH}fragmented-signal-data.png`, group: 'signal' },
  { id: 'incompleteSignalData', name: 'Incomplete Signal Data', icon: `${ICON_PATH}incomplete-signal-data.png`, group: 'signal' },
  { id: 'flawedSignalData', name: 'Flawed Signal Data', icon: `${ICON_PATH}flawed-signal-data.png`, group: 'signal' },
  { id: 'corruptedSignalData', name: 'Corrupted Signal Data', icon: `${ICON_PATH}corrupted-signal-data.png`, group: 'signal' }
];

/**
 * Incremental cost of raising an amplifier from the preceding tier.
 * Verified against swgoh-utils/gamedata recipe.json promotion recipes
 * relic_promotion_recipe_01 through _10 on 2026-08-31.
 */
export const RELIC_COST_BY_LEVEL = {
  1: { credits: 10000, carboniteCircuitBoard: 40 },
  2: { credits: 25000, fragmentedSignalData: 15, carboniteCircuitBoard: 30, bronziumWiring: 40 },
  3: { credits: 50000, fragmentedSignalData: 20, incompleteSignalData: 15, carboniteCircuitBoard: 30, bronziumWiring: 40, chromiumTransistor: 20 },
  4: { credits: 75000, fragmentedSignalData: 20, incompleteSignalData: 25, carboniteCircuitBoard: 30, bronziumWiring: 40, chromiumTransistor: 40 },
  5: { credits: 100000, fragmentedSignalData: 20, incompleteSignalData: 25, flawedSignalData: 15, carboniteCircuitBoard: 30, bronziumWiring: 40, chromiumTransistor: 30, aurodiumHeatsink: 20 },
  6: { credits: 250000, fragmentedSignalData: 20, incompleteSignalData: 25, flawedSignalData: 25, carboniteCircuitBoard: 20, bronziumWiring: 30, chromiumTransistor: 30, aurodiumHeatsink: 20, electriumConductor: 20 },
  7: { credits: 500000, fragmentedSignalData: 20, incompleteSignalData: 25, flawedSignalData: 35, carboniteCircuitBoard: 20, bronziumWiring: 30, chromiumTransistor: 20, aurodiumHeatsink: 20, electriumConductor: 20, zinbiddleCard: 10 },
  8: { credits: 1000000, fragmentedSignalData: 20, incompleteSignalData: 25, flawedSignalData: 45, chromiumTransistor: 20, aurodiumHeatsink: 20, electriumConductor: 20, zinbiddleCard: 20, impulseDetector: 20, aeromagnifier: 20 },
  9: { credits: 1500000, incompleteSignalData: 30, flawedSignalData: 55, electriumConductor: 20, zinbiddleCard: 20, impulseDetector: 20, aeromagnifier: 20, gyrdaKeypad: 20, droidBrain: 20 },
  10: { credits: 2000000, incompleteSignalData: 25, flawedSignalData: 45, corruptedSignalData: 15, impulseDetector: 20, aeromagnifier: 20, gyrdaKeypad: 20, droidBrain: 20, coaxialServomotor: 20 }
};

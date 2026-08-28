/** Community shorthand, so shared-unit tags stay readable inside a card. */
const TAG_ABBREVIATIONS = {
  'commander luke skywalker': 'CLS',
  'jedi knight luke skywalker': 'JKLS',
  'jedi master luke skywalker': 'JMLS',
  'jedi master kenobi': 'JMK',
  'jedi master mace windu': 'JMMW',
  'supreme leader kylo ren': 'SLKR',
  'sith eternal emperor': 'SEE',
  'pirate king hondo ohnaka': 'GL Hondo',
  'general skywalker': 'GAS',
  'jedi knight revan': 'JKR',
  'jedi knight cal kestis': 'JKCK',
  'grand master yoda': 'GMY',
  'grand admiral thrawn': 'GAT',
  'grand inquisitor': 'Inquisitor',
  "han's millennium falcon": 'HMF',
  'emperor palpatine': 'Palpatine'
};

const TAG_MAX_LENGTH = 18;
const MINOR_WORDS = ['the', 'of', 'and', 'a'];

/** Falls back to initials so future long names shorten without a map entry. */
function toInitials(name) {
  const initials = name
    .replace(/\([^)]*\)/g, ' ')
    .split(/[\s-]+/)
    .filter((word) => /^[a-z0-9]/i.test(word) && !MINOR_WORDS.includes(word.toLowerCase()))
    .map((word) => word[0].toUpperCase())
    .join('');

  return initials.length >= 2 ? initials : name;
}

export function abbreviatePhaseName(name) {
  const mapped = TAG_ABBREVIATIONS[name.trim().toLowerCase()];
  if (mapped) return mapped;

  return name.length > TAG_MAX_LENGTH ? toInitials(name) : name;
}

export function shortPhaseName(category) {
  const label = (category.split(':')[1] || category).trim();
  const parenthetical = label.match(/\(([^)]+)\)/);

  if (parenthetical && /^[A-Z0-9][A-Z0-9-]{1,5}$/.test(parenthetical[1])) {
    return parenthetical[1];
  }

  return label
    .replace(/\([^)]*\)/g, '')
    .replace(/galactic legend/i, '')
    .replace(/fleet priority/i, 'Fleet')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSharedUnitMap(roadmap) {
  const unitOccurrences = {};

  roadmap.forEach((phase, phaseIdx) => {
    const shortName = shortPhaseName(phase.category);

    const processList = (list) => {
      if (!list) return;
      list.forEach((target) => {
        const id = target.id ? target.id.toUpperCase() : '';
        if (!id) return;

        if (!unitOccurrences[id]) {
          unitOccurrences[id] = [];
        }
        if (!unitOccurrences[id].some((p) => p.index === phaseIdx)) {
          unitOccurrences[id].push({
            index: phaseIdx,
            name: shortName,
            tag: abbreviatePhaseName(shortName),
            label: phase.category
          });
        }
      });
    };

    processList(phase.characters);
    processList(phase.ships);
  });

  return unitOccurrences;
}

export function resolveBadge(phase, targetId, currentPhaseIndex, sharedMap) {
  // Recommended squads now come from src/data/recommendedSquads.js, so this
  // branch only covers the Leia overlap that the C-3PO prerequisite shares.
  if (phase.category.includes('C-3PO Event')) {
    if (['PRINCESSKNEESAA', 'CHIEFCHIRPA', 'WICKET'].includes(targetId)) {
      return { text: 'Shared with GL Leia', className: 'tag-shared', farms: [] };
    }
    return null;
  }

  const otherPhases = (sharedMap[targetId] || []).filter((p) => p.index !== currentPhaseIndex);
  if (otherPhases.length > 0) {
    const extra = otherPhases.length > 1 ? ` +${otherPhases.length - 1}` : '';
    return {
      text: `Also in ${otherPhases[0].tag ?? otherPhases[0].name}${extra}`,
      className: 'tag-shared',
      farms: otherPhases.map((p) => p.label ?? p.name)
    };
  }

  return null;
}

export const C3PO_TIP_HTML =
  '<strong>Farming Strategy:</strong> Princess Kneesaa, Chief Chirpa, and Wicket are already tracked under your Leia path.<br><br>' +
  '<strong>Recommendation:</strong> The squad marked ★ is the one the swgoh.wiki guide runs — ' +
  '<strong>Paploo</strong>, <strong>Ewok Elder</strong>, <strong>Wicket</strong>, <strong>Logray</strong> and <strong>Chief Chirpa</strong>.';

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
          unitOccurrences[id].push({ index: phaseIdx, name: shortName });
        }
      });
    };

    processList(phase.characters);
    processList(phase.ships);
  });

  return unitOccurrences;
}

export function resolveBadge(phase, targetId, currentPhaseIndex, sharedMap) {
  if (phase.category.includes('C-3PO Event')) {
    if (['PRINCESSKNEESAA', 'CHIEFCHIRPA', 'WICKET'].includes(targetId)) {
      return { text: 'Shared with GL Leia', className: 'tag-shared' };
    }
    if (['LOGRAY', 'EWOKELDER', 'PAPLOO'].includes(targetId)) {
      return { text: '★ Recommended', className: 'tag-recommended' };
    }
    return null;
  }

  const otherPhases = (sharedMap[targetId] || []).filter((p) => p.index !== currentPhaseIndex);
  if (otherPhases.length > 0) {
    const extra = otherPhases.length > 1 ? ` +${otherPhases.length - 1}` : '';
    return { text: `Also in ${otherPhases[0].name}${extra}`, className: 'tag-shared' };
  }

  return null;
}

export const C3PO_TIP_HTML =
  '<strong>Farming Strategy:</strong> Princess Kneesaa, Chief Chirpa, and Wicket are already tracked under your Leia path.<br><br>' +
  '<strong>Recommendation:</strong> Complete your 5-man event squad by adding <strong>Logray</strong>, <strong>Ewok Elder</strong>, and <strong>Paploo</strong>.';

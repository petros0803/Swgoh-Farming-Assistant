export function unitMatchesFilter(unitView, query, hideCompleted) {
  const matchesQuery = !query || unitView.name.toLowerCase().includes(query);
  return matchesQuery && !(hideCompleted && unitView.progress.isComplete);
}

export function filterPhases(phases, query, hideCompleted) {
  const normalized = query.trim().toLowerCase();
  let visibleTotal = 0;

  const filtered = phases.map((phase) => {
    const sections = phase.sections
      .map((section) => {
        const units = section.units.filter((unit) => unitMatchesFilter(unit, normalized, hideCompleted));
        visibleTotal += units.length;
        return { ...section, units };
      })
      .filter((section) => section.units.length);

    return { ...phase, sections };
  }).filter((phase) => phase.sections.length);

  return { phases: filtered, visibleTotal };
}

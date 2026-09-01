/**
 * The search box picks journeys, not the units inside them, so a match keeps
 * the whole squad on screen. Both the category and the reward are searched
 * because a category can name the event rather than its unit, as with
 * "⭐ Journey: Padmé Amidala (Separatist pool)".
 */
export function phaseMatchesQuery(phase, query) {
  if (!query) return true;
  return `${phase.category} ${phase.reward?.name ?? ''}`.toLowerCase().includes(query);
}

export function unitMatchesFilter(unitView, hideCompleted) {
  return !(hideCompleted && unitView.progress.isComplete);
}

export function filterPhases(phases, query, hideCompleted) {
  const normalized = query.trim().toLowerCase();
  let visibleTotal = 0;

  const filtered = phases
    .filter((phase) => phaseMatchesQuery(phase, normalized))
    .map((phase) => {
      const sections = phase.sections
        .map((section) => {
          const units = section.units.filter((unit) => unitMatchesFilter(unit, hideCompleted));
          visibleTotal += units.length;
          return { ...section, units };
        })
        .filter((section) => section.units.length);

      return { ...phase, sections };
    })
    .filter((phase) => phase.sections.length);

  return { phases: filtered, visibleTotal };
}

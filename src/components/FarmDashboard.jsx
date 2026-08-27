import { useMemo, useState } from 'react';
import ErrorBanner from './ErrorBanner';
import Roadmap from './Roadmap';
import StatsOverview from './StatsOverview';
import Toolbar from './Toolbar';
import Placeholder from './ui/Placeholder';
import { useRosterState } from '../context/rosterContext';
import { buildDashboard } from '../utils/dashboard';
import { filterPhases } from '../utils/filters';

export default function FarmDashboard({
  roadmap,
  startCollapsed = false,
  placeholderTitle,
  placeholderBody
}) {
  const { playerData, error } = useRosterState();
  const [query, setQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [collapsed, setCollapsed] = useState(() =>
    startCollapsed ? Object.fromEntries(roadmap.map((_, index) => [index, true])) : {}
  );
  const [allCollapsed, setAllCollapsed] = useState(startCollapsed);

  const dashboard = useMemo(
    () => (playerData ? buildDashboard(playerData, roadmap) : null),
    [playerData, roadmap]
  );

  const filtered = useMemo(() => {
    if (!dashboard) return { phases: [], visibleTotal: 0 };
    return filterPhases(dashboard.phases, query, hideCompleted);
  }, [dashboard, query, hideCompleted]);

  function handleTogglePhase(index) {
    setCollapsed((current) => ({ ...current, [index]: !current[index] }));
  }

  function handleToggleAll() {
    const next = !allCollapsed;
    setAllCollapsed(next);

    const nextMap = {};
    roadmap.forEach((_, index) => {
      nextMap[index] = next;
    });
    setCollapsed(nextMap);
  }

  return (
    <>
      {dashboard && <StatsOverview dashboard={dashboard} />}
      {dashboard && (
        <Toolbar
          query={query}
          onQueryChange={setQuery}
          hideCompleted={hideCompleted}
          onHideCompletedChange={setHideCompleted}
          allCollapsed={allCollapsed}
          onToggleAll={handleToggleAll}
        />
      )}
      <ErrorBanner message={error} />
      {!dashboard && !error && (
        <Placeholder title={placeholderTitle}>{placeholderBody}</Placeholder>
      )}
      {dashboard && (
        <Roadmap
          phases={filtered.phases}
          collapsed={collapsed}
          onTogglePhase={handleTogglePhase}
        />
      )}
    </>
  );
}

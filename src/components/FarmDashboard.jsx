import { useMemo, useState } from 'react';
import styled from 'styled-components';
import ErrorBanner from './ErrorBanner';
import FarmingGuide from './FarmingGuide';
import Roadmap from './Roadmap';
import StatsOverview from './StatsOverview';
import Toolbar from './Toolbar';
import Button from './ui/Button';
import Placeholder from './ui/Placeholder';
import { useRosterState } from '../context/rosterContext';
import { buildDashboard } from '../utils/dashboard';
import { buildFarmingGuide } from '../utils/farmingGuide';
import { filterPhases } from '../utils/filters';

export default function FarmDashboard({
  roadmap,
  startCollapsed = false,
  showGuide = false,
  poolChoices,
  onTogglePoolUnit,
  placeholderTitle,
  placeholderBody
}) {
  const { playerData, roster, previewMode, setPreviewMode, error } = useRosterState();
  const [query, setQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [collapsed, setCollapsed] = useState(() =>
    startCollapsed ? Object.fromEntries(roadmap.map((_, index) => [index, true])) : {}
  );
  const [allCollapsed, setAllCollapsed] = useState(startCollapsed);

  const dashboard = useMemo(
    () => (roster ? buildDashboard(roster, roadmap) : null),
    [roster, roadmap]
  );

  // Shared by the farming guide and by every unit card's hover preview, so the
  // acquisition data behind both is computed once.
  const guide = useMemo(
    () => (roster ? buildFarmingGuide(roster, roadmap, undefined, poolChoices) : null),
    [roster, roadmap, poolChoices]
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
      {dashboard && previewMode && (
        <PreviewNote>
          <Placeholder slim>
            Preview mode — every requirement is listed as if you owned nothing.{' '}
            {playerData
              ? 'Untick “Browse without a roster” in the header to go back to your synced roster.'
              : 'Sync your ally code to track your own progress.'}
          </Placeholder>
        </PreviewNote>
      )}
      {dashboard && showGuide && (
        <FarmingGuide guide={guide} onTogglePoolUnit={onTogglePoolUnit} />
      )}
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
        <Placeholder title={placeholderTitle}>
          {placeholderBody}
          <PreviewAction>
            <Button type="button" variant="ghost" onClick={() => setPreviewMode(true)}>
              Show requirements without a roster
            </Button>
          </PreviewAction>
        </Placeholder>
      )}
      {dashboard && (
        <Roadmap
          phases={filtered.phases}
          guide={guide}
          collapsed={collapsed}
          onTogglePhase={handleTogglePhase}
        />
      )}
    </>
  );
}

const PreviewNote = styled.div`
  margin-bottom: ${({ theme }) => theme.space[10]};
`;

const PreviewAction = styled.span`
  display: block;
  margin-top: ${({ theme }) => theme.space[7]};
`;

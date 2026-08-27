import { useMemo, useState } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import Toolbar from './components/Toolbar';
import Roadmap from './components/Roadmap';
import ErrorBanner from './components/ErrorBanner';
import Footer from './components/Footer';
import Placeholder from './components/ui/Placeholder';
import { ThemeRoot } from './theme';
import { useRoster } from './hooks/useRoster';
import { buildDashboard } from './utils/dashboard';
import { filterPhases } from './utils/filters';

export default function App() {
  return (
    <ThemeRoot>
      <AppShell />
    </ThemeRoot>
  );
}

function AppShell() {
  const { allyCode, setAllyCode, playerData, loading, error, syncRoster } = useRoster();
  const [query, setQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [allCollapsed, setAllCollapsed] = useState(false);

  const dashboard = useMemo(
    () => (playerData ? buildDashboard(playerData) : null),
    [playerData]
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
    if (!dashboard) return;
    const nextMap = {};
    dashboard.phases.forEach((phase) => {
      nextMap[phase.index] = next;
    });
    setCollapsed(nextMap);
  }

  return (
    <>
      <Header
        allyCode={allyCode}
        onAllyCodeChange={setAllyCode}
        onSync={() => syncRoster(allyCode)}
        loading={loading}
      />
      <Main>
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
          <Placeholder title="Enter your SWGoH Ally Code above to load your live roster status!">
            This web application connects directly to your public SWGoH profile to evaluate every target unit across all phases of your roadmap.
          </Placeholder>
        )}
        {dashboard && (
          <Roadmap
            phases={filtered.phases}
            collapsed={collapsed}
            onTogglePhase={handleTogglePhase}
          />
        )}
      </Main>
      <Footer />
    </>
  );
}

const Main = styled.main`
  max-width: ${({ theme }) => theme.sizes.content};
  width: 100%;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space[14]} ${({ theme }) => theme.space[10]} calc(${({ theme }) => theme.space[14]} + env(safe-area-inset-bottom));
  flex: 1;
  min-width: 0;

  ${({ theme }) => theme.media.phone} {
    padding: ${({ theme }) => theme.space[10]} ${({ theme }) => theme.space[8]} calc(${({ theme }) => theme.space[10]} + env(safe-area-inset-bottom));
  }
`;

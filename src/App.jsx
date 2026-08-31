import styled from 'styled-components';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import RosterProvider from './context/RosterProvider';
import { useRosterState } from './context/rosterContext';
import AllFarmsPage from './pages/AllFarmsPage';
import MyRoadmapPage from './pages/MyRoadmapPage';
import RelicCalculatorPage from './pages/RelicCalculatorPage';
import RoadmapPage from './pages/RoadmapPage';
import { ThemeRoot } from './theme';

export default function App() {
  return (
    <ThemeRoot>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <RosterProvider>
          <AppShell />
        </RosterProvider>
      </BrowserRouter>
    </ThemeRoot>
  );
}

function AppShell() {
  const {
    allyCode,
    setAllyCode,
    syncRoster,
    loading,
    previewMode,
    setPreviewMode
  } = useRosterState();

  return (
    <>
      <Header
        allyCode={allyCode}
        onAllyCodeChange={setAllyCode}
        onSync={(code) => syncRoster(code || allyCode)}
        loading={loading}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
      />
      <Main>
        <Routes>
          <Route path="/" element={<RoadmapPage />} />
          <Route path="/my-roadmap" element={<MyRoadmapPage />} />
          <Route path="/all-farms" element={<AllFarmsPage />} />
          <Route path="/relic-calculator" element={<RelicCalculatorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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

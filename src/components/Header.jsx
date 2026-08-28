import { NavLink, useLocation } from 'react-router-dom';
import Button from './ui/Button';
import TextField from './ui/TextField';
import ThemeSwitch from './ThemeSwitch';
import styled from 'styled-components';
import { normalizeAllyCode } from '../utils/format';

export const SAVED_ALLY_CODES = ['497825748', '964559642'];

const NAV_ITEMS = [
  { to: '/', label: '✨ Recommended Roadmap' },
  { to: '/my-roadmap', label: '🗺️ My Roadmap' },
  { to: '/all-farms', label: '📜 All Farms' }
];

export default function Header({
  allyCode,
  onAllyCodeChange,
  onSync,
  loading,
  previewMode,
  onPreviewModeChange
}) {
  const { search } = useLocation();

  function handleSubmit(event) {
    event.preventDefault();
    onSync(allyCode);
  }

  function handleSavedCode(event) {
    const code = event.target.value;
    if (!code) return;
    onAllyCodeChange(code);
    onSync(code);
  }

  const savedSelection = SAVED_ALLY_CODES.includes(normalizeAllyCode(allyCode))
    ? normalizeAllyCode(allyCode)
    : '';

  return (
    <Bar>
      <Inner>
        <Brand>
          <Logo aria-hidden="true">⚔️</Logo>
          <div>
            <Title>SWGoH HOLOCRON TRACKER</Title>
            <Subtitle>Plan, prioritize, and track every Journey Guide farm</Subtitle>
          </div>
        </Brand>
        <Actions>
          <ThemeCluster>
            <label className="sr-only" htmlFor="savedAllyCode">Saved ally codes</label>
            <SavedSelect
              id="savedAllyCode"
              value={savedSelection}
              onChange={handleSavedCode}
              disabled={loading}
            >
              <option value="">Saved ally codes</option>
              {SAVED_ALLY_CODES.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </SavedSelect>
            <ThemeSwitch />
          </ThemeCluster>
          <Form onSubmit={handleSubmit} autoComplete="off">
            <label className="sr-only" htmlFor="allyCode">Ally Code</label>
            <TextField
              type="text"
              id="allyCode"
              inputMode="numeric"
              placeholder="Ally Code (e.g. 123456789)"
              maxLength={11}
              value={allyCode}
              onChange={(event) => onAllyCodeChange(event.target.value)}
            />
            <Button type="submit" loading={loading}>
              {loading ? 'SYNCING...' : 'SYNC ROSTER'}
            </Button>
          </Form>
          <Switch>
            <input
              type="checkbox"
              checked={previewMode}
              onChange={(event) => onPreviewModeChange(event.target.checked)}
            />
            <span>Browse without a roster</span>
          </Switch>
        </Actions>
        <Nav aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavTab key={item.to} to={{ pathname: item.to, search }} end>
              {item.label}
            </NavTab>
          ))}
        </Nav>
      </Inner>
    </Bar>
  );
}

const Bar = styled.header`
  background-color: ${({ theme }) => theme.colors.header};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: calc(${({ theme }) => theme.space[8]} + env(safe-area-inset-top)) ${({ theme }) => theme.space[10]} ${({ theme }) => theme.space[8]};
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  box-shadow: ${({ theme }) => theme.shadows.header};

  ${({ theme }) => theme.media.phone} {
    padding-left: ${({ theme }) => theme.space[8]};
    padding-right: ${({ theme }) => theme.space[8]};
  }
`;

const Inner = styled.div`
  max-width: ${({ theme }) => theme.sizes.content};
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[8]};

  ${({ theme }) => theme.media.phone} {
    align-items: stretch;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[7]};
  min-width: 0;
`;

const Logo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  line-height: ${({ theme }) => theme.lineHeights.tight};

  ${({ theme }) => theme.media.phone} {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.heading};
  color: ${({ theme }) => theme.colors.gold};
  overflow-wrap: anywhere;

  ${({ theme }) => theme.media.phone} {
    font-size: ${({ theme }) => theme.fontSizes.headingPhone};
  }

  ${({ theme }) => theme.media.narrow} {
    font-size: ${({ theme }) => theme.fontSizes.headingNarrow};
  }
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.muted};
  margin-top: ${({ theme }) => theme.space[1]};

  ${({ theme }) => theme.media.narrow} {
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[6]};
  min-width: 0;

  ${({ theme }) => theme.media.phone} {
    width: 100%;
    flex-direction: column;
    align-items: flex-end;
  }
`;

const ThemeCluster = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[5]};
  min-width: 0;

  ${({ theme }) => theme.media.phone} {
    width: 100%;
  }
`;

const SavedSelect = styled.select`
  min-width: 0;
  min-height: ${({ theme }) => theme.sizes.tap};
  background-color: ${({ theme }) => theme.colors.bg};
  border: ${({ theme }) => theme.borders.thin} solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.base};
  padding: ${({ theme }) => `${theme.space[5]} ${theme.space[8]}`};
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;

  ${({ theme }) => theme.media.phone} {
    flex: 1;
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.blue};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.focus};
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`;

const Switch = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  min-height: ${({ theme }) => theme.sizes.tap};
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;
  user-select: none;
  white-space: nowrap;

  input {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.blue};
    cursor: pointer;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Nav = styled.nav`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[5]};
  flex-wrap: wrap;
  padding-top: ${({ theme }) => theme.space[7]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const NavTab = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  min-height: ${({ theme }) => theme.sizes.tap};
  padding: ${({ theme }) => `${theme.space[3]} ${theme.space[7]}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  background-color: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.borderStrong};
    background-color: ${({ theme }) => theme.colors.hover};
  }

  &.active {
    color: ${({ theme }) => theme.colors.gold};
    border-color: ${({ theme }) => theme.colors.gold};
    background-color: ${({ theme }) => theme.colors.infoSoft};
  }

  ${({ theme }) => theme.media.phone} {
    flex: 1 1 auto;
    justify-content: center;
  }
`;

const Form = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.space[5]};
  min-width: 0;

  input {
    min-width: 0;
    flex: 1 1 180px;
  }

  ${({ theme }) => theme.media.phone} {
    width: 100%;
    flex-direction: column;

    input,
    button {
      width: 100%;
    }

    input {
      flex: none;
    }
  }
`;

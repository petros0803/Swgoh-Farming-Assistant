import styled from 'styled-components';
import Button from './ui/Button';
import TextField from './ui/TextField';

export default function Toolbar({
  query,
  onQueryChange,
  hideCompleted,
  onHideCompletedChange,
  allCollapsed,
  onToggleAll
}) {
  return (
    <Bar>
      <Row>
        <Field>
          <FieldIcon aria-hidden="true">🔍</FieldIcon>
          <label className="sr-only" htmlFor="unitFilter">Filter units by name</label>
          <SearchField
            type="search"
            id="unitFilter"
            placeholder="Filter units by name…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </Field>
        <Actions>
          <Switch>
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(event) => onHideCompletedChange(event.target.checked)}
            />
            <span>Hide completed</span>
          </Switch>
          <Button type="button" variant="ghost" onClick={onToggleAll}>
            {allCollapsed ? 'Expand all' : 'Collapse all'}
          </Button>
        </Actions>
      </Row>
      <Legend>
        <Group>
          <Item><Swatch $tone="light" />Light Side</Item>
          <Item><Swatch $tone="dark" />Dark Side</Item>
          <Item><Swatch $tone="neutral" />Unaligned</Item>
        </Group>
        <Divider aria-hidden="true" />
        <Group>
          <Item><Swatch $tone="done" />Ready</Item>
          <Item><Swatch $tone="wip" />In progress</Item>
          <Item><Swatch $tone="todo" />Not started</Item>
        </Group>
      </Legend>
    </Bar>
  );
}

const Bar = styled.section`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => `${theme.space[7]} ${theme.space[9]}`};
  margin-bottom: ${({ theme }) => theme.space[13]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[7]};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[7]};
  flex-wrap: wrap;

  ${({ theme }) => theme.media.phone} {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Field = styled.div`
  position: relative;
  flex: 1 1 260px;
  min-width: 0;
`;

const FieldIcon = styled.span`
  position: absolute;
  left: ${({ theme }) => theme.space[6]};
  top: 50%;
  transform: translateY(-50%);
  font-size: ${({ theme }) => theme.fontSizes.base};
  opacity: 0.6;
  pointer-events: none;
`;

const SearchField = styled(TextField)`
  width: 100%;
  padding-left: 38px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[6]};
  flex-wrap: wrap;

  ${({ theme }) => theme.media.phone} {
    width: 100%;
    justify-content: space-between;

    button {
      flex: 1 1 auto;
    }
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

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]};
  flex-wrap: wrap;
  padding-top: ${({ theme }) => theme.space[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Group = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[7]};
  flex-wrap: wrap;
`;

const Item = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.muted};
`;

const Divider = styled.span`
  width: 1px;
  height: ${({ theme }) => theme.space[8]};
  background: ${({ theme }) => theme.colors.border};
`;

const swatchColors = {
  light: (theme) => theme.colors.blue,
  dark: (theme) => theme.colors.red,
  neutral: (theme) => theme.colors.text,
  done: (theme) => theme.colors.green,
  wip: (theme) => theme.colors.gold,
  todo: (theme) => theme.colors.red
};

const Swatch = styled.i`
  width: ${({ theme }) => theme.sizes.swatch};
  height: ${({ theme }) => theme.sizes.swatch};
  border-radius: 3px;
  display: inline-block;
  flex-shrink: 0;
  background: ${({ theme, $tone }) => (swatchColors[$tone] ?? swatchColors.todo)(theme)};
`;

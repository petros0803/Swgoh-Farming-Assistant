import { useId, useState } from 'react';
import styled from 'styled-components';

/** Pools this long need a filter box to stay usable — Empire lists 44 units. */
const FILTER_THRESHOLD = 12;

export default function PoolSquadPicker({
  units,
  requirement,
  selectedUnitIds,
  rewardName,
  onToggle
}) {
  const [query, setQuery] = useState('');
  const filterId = `pool-filter-${useId()}`;
  const selected = new Set(selectedUnitIds);
  const showFilter = units.length > FILTER_THRESHOLD;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleUnits = normalizedQuery
    ? units.filter((unit) => unit.name.toLowerCase().includes(normalizedQuery))
    : units;

  return (
    <Panel
      role="group"
      aria-label={`Choose ${requirement.count} ${requirement.label} for ${rewardName}`}
    >
      <Heading>
        <span>
          Choose the {requirement.count} {requirement.label} you want to farm
        </span>
        <Count $complete={selected.size === requirement.count}>
          {selected.size} / {requirement.count} selected
        </Count>
      </Heading>

      {showFilter && (
        <>
          <label className="sr-only" htmlFor={filterId}>
            Filter {requirement.label} for {rewardName}
          </label>
          <Filter
            id={filterId}
            type="search"
            value={query}
            placeholder={`Filter ${units.length} eligible units…`}
            onChange={(event) => setQuery(event.target.value)}
          />
        </>
      )}

      <Options $scroll={showFilter}>
        {visibleUnits.length === 0 && <Empty>No eligible unit matches “{query}”.</Empty>}
        {visibleUnits.map((unit) => {
          const checked = selected.has(unit.id);

          return (
            <Option key={unit.id} $checked={checked}>
              <input
                type="checkbox"
                checked={checked}
                disabled={!checked && selected.size >= requirement.count}
                onChange={() => onToggle(unit.id)}
              />
              {unit.icon && <Portrait src={unit.icon} alt="" loading="lazy" />}
              <span>{unit.name}</span>
            </Option>
          );
        })}
      </Options>
    </Panel>
  );
}

const Panel = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  padding: ${({ theme }) => theme.space[6]};
`;

const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space[5]};
  margin-bottom: ${({ theme }) => theme.space[5]};
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};

  ${({ theme }) => theme.media.phone} {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Count = styled.span`
  flex-shrink: 0;
  color: ${({ theme, $complete }) => ($complete ? theme.colors.green : theme.colors.gold)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Filter = styled.input`
  width: 100%;
  min-height: ${({ theme }) => theme.sizes.tap};
  margin-bottom: ${({ theme }) => theme.space[5]};
  background: ${({ theme }) => theme.colors.sunken};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  padding: ${({ theme }) => `${theme.space[4]} ${theme.space[6]}`};

  &:focus {
    border-color: ${({ theme }) => theme.colors.blue};
    outline: 3px solid ${({ theme }) => theme.colors.focus};
  }
`;

const Options = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: ${({ theme }) => theme.space[3]};
  ${({ $scroll }) => $scroll && 'max-height: 300px; overflow-y: auto;'}
`;

const Option = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  min-height: ${({ theme }) => theme.sizes.tap};
  border: 1px solid
    ${({ theme, $checked }) => ($checked ? theme.colors.blue : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $checked }) => ($checked ? theme.colors.infoSoft : theme.colors.sunken)};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.space[3]};
  cursor: pointer;

  &:has(input:disabled) {
    cursor: not-allowed;
    opacity: 0.55;
  }

  input {
    accent-color: ${({ theme }) => theme.colors.blue};
  }
`;

const Portrait = styled.img`
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radii.sm};
  object-fit: cover;
`;

const Empty = styled.p`
  color: ${({ theme }) => theme.colors.muted};
`;

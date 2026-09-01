import { useEffect, useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { getPoolRequirement } from '../data/poolRequirements';
import { sortFarmsByName } from '../utils/farmLabels';

/** "👑 Galactic Legend: Leia Organa" → "Galactic Legend". */
function farmKind(category = '') {
  return category.split(':')[0].replace(/^[^A-Za-z]+/, '').trim();
}

function farmHint(farm) {
  const requirement = getPoolRequirement(farm);
  return requirement ? `Pick ${requirement.count} ${requirement.label}` : null;
}

/**
 * Farm chooser for the roadmap builder. A native select cannot show portraits
 * or a filter, and the catalog is far too long to scan without one.
 */
export default function FarmPicker({ farms, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const returnFocusRef = useRef(false);

  const options = useMemo(() => sortFarmsByName(farms), [farms]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOptions = useMemo(
    () => (normalizedQuery
      ? options.filter((farm) =>
        `${farm.reward.name} ${farm.event} ${farm.category}`.toLowerCase().includes(normalizedQuery))
      : options),
    [options, normalizedQuery]
  );
  const selected = options.find((farm) => farm.event === value) ?? null;
  const activeOption = visibleOptions[activeIndex] ?? null;

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  // The trigger is swapped out for the search box while the list is open, so
  // focus can only go back to it once it has been rendered again.
  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
      return;
    }

    if (returnFocusRef.current) {
      returnFocusRef.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    const active = listRef.current?.querySelector('[data-active="true"]');
    // Guarded because jsdom has no layout, so it never implements scrolling.
    active?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, open]);

  function openList() {
    setQuery('');
    const selectedIndex = options.findIndex((farm) => farm.event === value);
    setActiveIndex(selectedIndex > -1 ? selectedIndex : 0);
    setOpen(true);
  }

  function closeList({ restoreFocus = true } = {}) {
    returnFocusRef.current = restoreFocus;
    setOpen(false);
    setQuery('');
  }

  function selectFarm(farm) {
    onChange(farm.event);
    closeList();
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => {
        if (visibleOptions.length === 0) return 0;
        return (current + step + visibleOptions.length) % visibleOptions.length;
      });
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : Math.max(0, visibleOptions.length - 1));
      return;
    }

    if (event.key === 'Enter' && activeOption) {
      event.preventDefault();
      selectFarm(activeOption);
      return;
    }

    if (event.key === 'Escape' || event.key === 'Tab') {
      closeList({ restoreFocus: event.key === 'Escape' });
    }
  }

  function handleTriggerKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openList();
    }
  }

  if (options.length === 0) {
    return (
      <Shell ref={containerRef}>
        <Trigger type="button" disabled aria-label="Choose a farm">
          <TriggerText>
            <Placeholder>All farms are already on your roadmap</Placeholder>
          </TriggerText>
        </Trigger>
      </Shell>
    );
  }

  return (
    <Shell ref={containerRef}>
      {open ? (
        <SearchRow>
          <SearchIcon aria-hidden="true">⌕</SearchIcon>
          <Search
            ref={searchRef}
            type="text"
            role="combobox"
            aria-label="Choose a farm"
            aria-expanded="true"
            aria-controls="farm-picker-list"
            aria-autocomplete="list"
            aria-activedescendant={activeOption ? `farm-option-${activeOption.event}` : undefined}
            value={query}
            placeholder={`Search ${options.length} farms…`}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </SearchRow>
      ) : (
        <Trigger
          ref={triggerRef}
          type="button"
          aria-label="Choose a farm"
          aria-haspopup="listbox"
          aria-expanded="false"
          onClick={openList}
          onKeyDown={handleTriggerKeyDown}
        >
          {selected?.reward.icon && <TriggerIcon src={selected.reward.icon} alt="" />}
          <TriggerText>
            {selected ? (
              <>
                <TriggerName>{selected.reward.name}</TriggerName>
                <TriggerMeta>{selected.event}</TriggerMeta>
              </>
            ) : (
              <Placeholder>Choose a farm to add…</Placeholder>
            )}
          </TriggerText>
          <Chevron aria-hidden="true">▼</Chevron>
        </Trigger>
      )}

      {open && (
        <Panel>
          {visibleOptions.length === 0 ? (
            <Empty>No farm matches “{query}”.</Empty>
          ) : (
            <List id="farm-picker-list" role="listbox" aria-label="Farms" ref={listRef}>
              {visibleOptions.map((farm, index) => {
                const hint = farmHint(farm);

                return (
                  <Option
                    key={farm.event}
                    id={`farm-option-${farm.event}`}
                    role="option"
                    type="button"
                    aria-selected={farm.event === value}
                    data-active={index === activeIndex}
                    $active={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectFarm(farm)}
                  >
                    <OptionIcon src={farm.reward.icon} alt="" loading="lazy" />
                    <OptionText>
                      <OptionName>{farm.reward.name}</OptionName>
                      <OptionMeta>
                        {farm.event}
                        {hint && <Hint> · {hint}</Hint>}
                      </OptionMeta>
                    </OptionText>
                    <Kind>{farmKind(farm.category)}</Kind>
                  </Option>
                );
              })}
            </List>
          )}
        </Panel>
      )}
    </Shell>
  );
}

const Shell = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

const fieldStyles = css`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[5]};
  width: 100%;
  min-height: ${({ theme }) => theme.sizes.tap};
  padding: ${({ theme }) => `${theme.space[4]} ${theme.space[6]}`};
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  text-align: left;
`;

const Trigger = styled.button`
  ${fieldStyles}
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.borderStrong};
    background: ${({ theme }) => theme.colors.hover};
  }

  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.blue};
    outline: 3px solid ${({ theme }) => theme.colors.focus};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const SearchRow = styled.div`
  ${fieldStyles}
  border-color: ${({ theme }) => theme.colors.blue};
  outline: 3px solid ${({ theme }) => theme.colors.focus};
`;

const SearchIcon = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

const Search = styled.input`
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  color: inherit;
  font: inherit;

  &:focus {
    outline: none;
  }
`;

const TriggerIcon = styled.img`
  width: ${({ theme }) => theme.sizes.phasePortrait};
  height: ${({ theme }) => theme.sizes.phasePortrait};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  object-fit: cover;
  flex-shrink: 0;
`;

const TriggerText = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const TriggerName = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TriggerMeta = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Placeholder = styled.span`
  color: ${({ theme }) => theme.colors.muted};
`;

const Chevron = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  flex-shrink: 0;
`;

const Panel = styled.div`
  position: absolute;
  z-index: ${({ theme }) => theme.zIndex.tip};
  top: calc(100% + ${({ theme }) => theme.space[3]});
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.lift};
  overflow: hidden;
`;

const List = styled.div`
  max-height: 320px;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space[3]};
  display: grid;
  gap: ${({ theme }) => theme.space[1]};
`;

const Option = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[6]};
  width: 100%;
  padding: ${({ theme }) => `${theme.space[4]} ${theme.space[5]}`};
  background: ${({ theme, $active }) => ($active ? theme.colors.hover : 'transparent')};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.border : 'transparent')};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &[aria-selected='true'] {
    border-color: ${({ theme }) => theme.colors.blue};
  }
`;

const OptionIcon = styled.img`
  width: ${({ theme }) => theme.sizes.phasePortrait};
  height: ${({ theme }) => theme.sizes.phasePortrait};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  object-fit: cover;
  flex-shrink: 0;
`;

const OptionText = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const OptionName = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const OptionMeta = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Hint = styled.span`
  color: ${({ theme }) => theme.colors.blue};
`;

const Kind = styled.span`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  letter-spacing: ${({ theme }) => theme.letterSpacing.label};
  text-transform: uppercase;
  background: ${({ theme }) => theme.colors.track};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[5]}`};

  ${({ theme }) => theme.media.phone} {
    display: none;
  }
`;

const Empty = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  padding: ${({ theme }) => theme.space[6]};
`;

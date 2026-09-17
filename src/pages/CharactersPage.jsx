import { useDeferredValue, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AcquisitionSourceList } from '../components/UnitFarmCard';
import { characterCatalog, shipCatalog, unitPortrait } from '../utils/unitCatalog';

const FILTERS = [
  { id: 'all', label: 'All sources' },
  { id: 'node', label: 'Battle nodes' },
  { id: 'store', label: 'Stores' },
  { id: 'event', label: 'Events' },
  { id: 'untracked', label: 'Untracked' }
];

function matchesFilter(character, filter) {
  if (filter === 'all') return true;
  if (filter === 'node') return character.sources.some((source) => source.type.endsWith('-node'));
  if (filter === 'untracked') return character.sources.length === 0;
  if (filter === 'event') {
    return character.sources.some((source) => source.type === 'event' || source.type === 'journey');
  }
  return character.sources.some((source) => source.type === filter);
}

export default function CharactersPage({ kind = 'character' }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const catalog = kind === 'ship' ? shipCatalog : characterCatalog;
  const singular = kind === 'ship' ? 'ship' : 'character';
  const plural = kind === 'ship' ? 'ships' : 'characters';
  const units = useMemo(
    () => catalog.filter((character) => {
      const searchable = [
        character.name,
        character.id,
        ...character.sources.flatMap((source) => [
          source.label,
          source.currency,
          ...(source.offers ?? []).map((offer) => offer.currency)
        ])
      ].filter(Boolean).join(' ').toLowerCase();
      return (!deferredQuery || searchable.includes(deferredQuery)) &&
        matchesFilter(character, filter);
    }),
    [catalog, deferredQuery, filter]
  );

  return (
    <Page>
      <Hero>
        <Eyebrow>{singular.toUpperCase()} ACQUISITION DIRECTORY</Eyebrow>
        <h2>Where to farm every {singular}</h2>
        <p>
          Search every obtainable {singular} and see their battle nodes, rotating stores,
          prices, currencies, and event unlocks from the app&apos;s shared source catalog.
        </p>
      </Hero>

      <Controls>
        <SearchLabel>
          <span>Search {plural} or farming locations</span>
          <Search
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${catalog.length} ${plural}…`}
          />
        </SearchLabel>
        <Filters aria-label={`Filter ${plural} by acquisition source`}>
          {FILTERS.map((item) => (
            <FilterButton
              key={item.id}
              type="button"
              $active={filter === item.id}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </FilterButton>
          ))}
        </Filters>
      </Controls>

      <ResultCount
        aria-live="polite"
        aria-label={`Showing ${units.length} of ${catalog.length} ${plural}`}
      >
        Showing <strong>{units.length}</strong> of {catalog.length} {plural}
      </ResultCount>

      {units.length > 0 ? (
        <Grid>
          {units.map((character) => (
            <Card key={character.id}>
              <CardHeader>
                {character.icon && <Portrait src={unitPortrait(character)} alt="" loading="lazy" />}
                <div>
                  <h3>{character.name}</h3>
                  <Alignment $alignment={character.alignment}>{character.alignment} side</Alignment>
                </div>
              </CardHeader>
              <SourceHeading>
                {character.sources.length > 0
                  ? `${character.sources.length} acquisition source${character.sources.length === 1 ? '' : 's'}`
                  : 'Acquisition source'}
              </SourceHeading>
              <AcquisitionSourceList
                sources={character.sources}
                kind={character.kind}
                empty="No current repeatable node, store, or event source was found."
              />
            </Card>
          ))}
        </Grid>
      ) : (
        <Empty>No {plural} match this search and source filter.</Empty>
      )}
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[9]};
`;

const Hero = styled.section`
  padding: ${({ theme }) => theme.space[12]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.infoSoft}, ${({ theme }) => theme.colors.card});

  h2 {
    margin: ${({ theme }) => `${theme.space[3]} 0 ${theme.space[4]}`};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes['4xl']};
  }

  p {
    max-width: ${({ theme }) => theme.sizes.contentText};
    color: ${({ theme }) => theme.colors.muted};
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
  }
`;

const Eyebrow = styled.div`
  color: ${({ theme }) => theme.colors.blue};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
`;

const Controls = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
  padding: ${({ theme }) => theme.space[8]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.card};
`;

const SearchLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const Search = styled.input`
  width: 100%;
  min-height: ${({ theme }) => theme.sizes.tap};
  padding: ${({ theme }) => `0 ${theme.space[6]}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;

  &:focus {
    border-color: ${({ theme }) => theme.colors.blue};
    outline: 3px solid ${({ theme }) => theme.colors.focus};
  }
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
`;

const FilterButton = styled.button`
  min-height: ${({ theme }) => theme.sizes.tap};
  padding: ${({ theme }) => `0 ${theme.space[6]}`};
  border: 1px solid ${({ theme, $active }) => $active ? theme.colors.blue : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $active }) => $active ? theme.colors.infoSoft : theme.colors.sunken};
  color: ${({ theme, $active }) => $active ? theme.colors.blue : theme.colors.muted};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  cursor: pointer;
`;

const ResultCount = styled.p`
  color: ${({ theme }) => theme.colors.muted};

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: ${({ theme }) => theme.space[6]};
`;

const Card = styled.article`
  min-width: 0;
  padding: ${({ theme }) => theme.space[7]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.card};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[5]};
  margin-bottom: ${({ theme }) => theme.space[6]};

  h3 {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

const Portrait = styled.img`
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  border: 2px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.round};
  background: ${({ theme }) => theme.colors.bg};
  object-fit: cover;
`;

const Alignment = styled.span`
  color: ${({ theme, $alignment }) =>
    $alignment === 'light' ? theme.colors.blue :
      $alignment === 'dark' ? theme.colors.red : theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-transform: capitalize;
`;

const SourceHeading = styled.div`
  margin-bottom: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.label};
  text-transform: uppercase;
`;

const Empty = styled.div`
  padding: ${({ theme }) => theme.space[14]};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.muted};
  text-align: center;
`;

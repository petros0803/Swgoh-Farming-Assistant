import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UnitCard from './UnitCard';
import { farmingRoadmap } from '../data/farmingRoadmap';
import { buildDashboard } from '../utils/dashboard';
import { buildFarmingGuide } from '../utils/farmingGuide';
import { renderWithTheme } from '../test/renderWithTheme';

const emptyRoster = { data: { name: 'Test' }, units: [] };

/** Real roadmap props, so the preview shows the acquisition data players see. */
function roadmapCard(unitName) {
  const dashboard = buildDashboard(emptyRoster, farmingRoadmap);

  for (const phase of dashboard.phases) {
    for (const section of phase.sections) {
      const match = section.units.find((candidate) => candidate.target.name === unitName);
      if (match) {
        return {
          unit: match,
          guide: buildFarmingGuide(emptyRoster, farmingRoadmap),
          goalName: phase.reward?.name ?? phase.category
        };
      }
    }
  }

  throw new Error(`${unitName} is not on the roadmap`);
}

function hoverCard(name) {
  return screen.getByText(name).closest('article');
}

const unit = {
  id: 'VADER',
  name: 'Darth Vader',
  target: {
    name: 'Darth Vader',
    alignment: 'dark',
    targetR: 7,
    targetStars: 7,
    icon: ''
  },
  progress: {
    currentStars: 7,
    currentRelic: 7,
    currentGear: 13,
    isComplete: true,
    statusText: 'Ready',
    progressPct: 100,
    statusClass: 'completed',
    inRoster: true
  },
  badge: { text: 'Also in JKL', className: 'tag-shared' },
  portrait: ''
};

describe('UnitCard', () => {
  it('renders name, relic pills, and shared tag', () => {
    renderWithTheme(<UnitCard unit={unit} />);
    expect(screen.getByText('Darth Vader')).toBeInTheDocument();
    expect(screen.getByText('G13')).toBeInTheDocument();
    expect(screen.getByText('R7 / 7')).toBeInTheDocument();
    expect(screen.getByText('Also in JKL')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('tags a community-recommended unit alongside its shared tag', () => {
    renderWithTheme(<UnitCard unit={{ ...unit, recommended: true }} />);

    expect(screen.getByText('★ Recommended')).toBeInTheDocument();
    expect(screen.getByText('Also in JKL')).toBeInTheDocument();
  });

  it('leaves units out of the recommended squad untagged', () => {
    renderWithTheme(<UnitCard unit={{ ...unit, recommended: false }} />);

    expect(screen.queryByText('★ Recommended')).not.toBeInTheDocument();
  });

  it('previews where to farm the unit on hover', async () => {
    const user = userEvent.setup();
    const props = roadmapCard('Chief Chirpa');

    renderWithTheme(<UnitCard {...props} />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Held onto: once open, the preview repeats the name the query matches.
    const card = hoverCard('Chief Chirpa');
    await user.hover(card);
    const preview = screen.getByRole('tooltip');

    // Same detail as the farming order: the node, its energy and the ETA.
    expect(preview).toHaveTextContent(/Cantina 5-D · 12 energy/);
    expect(preview).toHaveTextContent(/days/);
    // The grid is per phase, so the note names this phase's own gate.
    expect(preview).toHaveTextContent(`${props.goalName} needs`);

    await user.unhover(card);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('names the event for a unit an event hands over', async () => {
    const user = userEvent.setup();
    const props = roadmapCard("Han's Millennium Falcon");

    renderWithTheme(<UnitCard {...props} />);
    await user.hover(hoverCard("Han's Millennium Falcon"));

    const preview = screen.getByRole('tooltip');

    expect(preview).toHaveTextContent('Unlocks from the Flight of the Falcon event');
    expect(preview).toHaveTextContent('not a shard farm');
  });

  it('skips the preview until a roster has been synced', async () => {
    const user = userEvent.setup();

    renderWithTheme(<UnitCard unit={unit} />);
    await user.hover(hoverCard('Darth Vader'));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('lists every other farm in the shared tag tooltip', () => {
    const shared = {
      ...unit,
      badge: {
        text: 'Also in CLS +1',
        className: 'tag-shared',
        farms: ['⭐ Journey: Commander Luke Skywalker', '👑 Galactic Legend: Leia Organa']
      }
    };

    renderWithTheme(<UnitCard unit={shared} />);

    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveTextContent('⭐ Journey: Commander Luke Skywalker');
    expect(tooltip).toHaveTextContent('👑 Galactic Legend: Leia Organa');
  });
});

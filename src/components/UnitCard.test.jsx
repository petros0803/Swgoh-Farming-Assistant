import { screen } from '@testing-library/react';
import UnitCard from './UnitCard';
import { renderWithTheme } from '../test/renderWithTheme';

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

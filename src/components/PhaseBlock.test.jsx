import { screen } from '@testing-library/react';
import PhaseBlock from './PhaseBlock';
import { renderWithTheme } from '../test/renderWithTheme';

const phase = {
  index: 0,
  category: '👑 Galactic Legend: Jedi Master Luke Skywalker',
  note: null,
  reward: { name: 'Jedi Master Luke Skywalker', icon: '/assets/characters/JMLS.png' },
  isC3po: false,
  sections: [],
  met: 2,
  total: 15,
  percent: 13,
  done: false
};

describe('PhaseBlock', () => {
  it('shows the unlocked character portrait in the header', () => {
    renderWithTheme(<PhaseBlock phase={phase} expanded={false} onToggle={() => {}} />);

    const portrait = screen.getByAltText('Jedi Master Luke Skywalker');
    expect(portrait).toHaveAttribute('src', '/assets/characters/JMLS.png');
  });

  it('renders the header without a portrait when the phase has no reward', () => {
    renderWithTheme(
      <PhaseBlock phase={{ ...phase, reward: null }} expanded={false} onToggle={() => {}} />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(/Jedi Master Luke Skywalker/)).toBeInTheDocument();
  });
});

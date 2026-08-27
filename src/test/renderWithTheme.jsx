import { render } from '@testing-library/react';
import { ThemeRoot } from '../theme';

export function renderWithTheme(ui, options) {
  return render(<ThemeRoot>{ui}</ThemeRoot>, options);
}

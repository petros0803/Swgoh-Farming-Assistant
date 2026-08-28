import { createContext, useContext } from 'react';

export const RosterContext = createContext({
  allyCode: '',
  setAllyCode: () => {},
  playerData: null,
  previewMode: false,
  setPreviewMode: () => {},
  roster: null,
  loading: false,
  error: '',
  clearError: () => {},
  syncRoster: () => {}
});

export function useRosterState() {
  return useContext(RosterContext);
}

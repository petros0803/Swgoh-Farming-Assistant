import { useRoster } from '../hooks/useRoster';
import { RosterContext } from './rosterContext';

/** One synced roster shared by every route, so switching pages keeps the data. */
export default function RosterProvider({ children }) {
  const roster = useRoster();

  return <RosterContext.Provider value={roster}>{children}</RosterContext.Provider>;
}

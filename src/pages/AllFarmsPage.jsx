import FarmDashboard from '../components/FarmDashboard';
import { getCatalog } from '../data/catalogState';
import { sortFarmsByName } from '../utils/farmLabels';

export default function AllFarmsPage() {
  const farms = sortFarmsByName(getCatalog().farms);

  return (
    <FarmDashboard
      roadmap={farms}
      startCollapsed
      placeholderTitle="Every Galactic Legend and Journey Guide farm, with full requirements."
      placeholderBody="Enter your Ally Code above to check your roster against every unlock event at once. Sections start collapsed — open the ones you are working toward."
    />
  );
}

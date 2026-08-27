import FarmDashboard from '../components/FarmDashboard';
import { allFarmsRoadmap } from '../data/allFarmsRoadmap';

export default function AllFarmsPage() {
  return (
    <FarmDashboard
      roadmap={allFarmsRoadmap}
      startCollapsed
      placeholderTitle="Every Galactic Legend and Journey Guide farm, with full requirements."
      placeholderBody="Enter your Ally Code above to check your roster against every unlock event at once. Sections start collapsed — open the ones you are working toward."
    />
  );
}

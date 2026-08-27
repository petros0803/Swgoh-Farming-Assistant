import FarmDashboard from '../components/FarmDashboard';
import { farmingRoadmap } from '../data/farmingRoadmap';

export default function RoadmapPage() {
  return (
    <FarmDashboard
      roadmap={farmingRoadmap}
      placeholderTitle="Enter your SWGoH Ally Code above to load your live roster status!"
      placeholderBody="This web application connects directly to your public SWGoH profile to evaluate every target unit across all phases of your roadmap."
    />
  );
}

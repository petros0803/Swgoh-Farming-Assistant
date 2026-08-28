import FarmDashboard from '../components/FarmDashboard';
import { farmingRoadmap } from '../data/farmingRoadmap';

export default function RoadmapPage() {
  return (
    <FarmDashboard
      roadmap={farmingRoadmap}
      showGuide
      placeholderTitle="Recommended Roadmap"
      placeholderBody="Enter your SWGoH Ally Code above to generate a roster-aware farming order and interactive dependency map for Executor, Leia, JKL, and Jabba."
    />
  );
}

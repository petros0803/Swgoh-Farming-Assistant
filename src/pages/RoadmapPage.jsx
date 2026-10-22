import FarmDashboard from '../components/FarmDashboard';
import { getCatalog } from '../data/catalogState';

export default function RoadmapPage() {
  return (
    <FarmDashboard
      roadmap={getCatalog().priorityFarms}
      showGuide
      placeholderTitle="Recommended Roadmap"
      placeholderBody="Enter your SWGoH Ally Code above to generate a roster-aware farming order and interactive dependency map for Executor, Leia, JKL, and Jabba."
    />
  );
}

import FarmDashboard from '../components/FarmDashboard';
import MyRoadmapEditor from '../components/MyRoadmapEditor';
import Placeholder from '../components/ui/Placeholder';
import { useMyRoadmap } from '../hooks/useMyRoadmap';

export default function MyRoadmapPage() {
  const {
    roadmap,
    poolChoices,
    availableFarms,
    addFarm,
    removeFarm,
    moveFarm,
    togglePoolUnit
  } = useMyRoadmap();

  return (
    <>
      <MyRoadmapEditor
        roadmap={roadmap}
        availableFarms={availableFarms}
        onAdd={addFarm}
        onRemove={removeFarm}
        onMove={moveFarm}
        onTogglePoolUnit={togglePoolUnit}
      />

      {roadmap.length === 0 ? (
        <Placeholder title="Your roadmap is empty" slim>
          Choose your first farm above. Each farm will appear here in the priority order you select.
        </Placeholder>
      ) : (
        <FarmDashboard
          roadmap={roadmap}
          showGuide
          poolChoices={poolChoices}
          onTogglePoolUnit={togglePoolUnit}
          placeholderTitle="Your roadmap is ready"
          placeholderBody="Enter your SWGoH Ally Code above to compare your roster with your selected farms."
        />
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import styled from 'styled-components';
import Button from './ui/Button';
import FarmPicker from './FarmPicker';
import PoolSquadPicker from './PoolSquadPicker';
import { getFarmUnits, getPoolRequirement } from '../data/poolRequirements';

export default function MyRoadmapEditor({
  roadmap,
  availableFarms,
  onAdd,
  onRemove,
  onMove,
  onTogglePoolUnit
}) {
  const [selectedKey, setSelectedKey] = useState('');

  // A farm that has just been added is no longer offered, so the picker clears
  // itself instead of pointing at something the roadmap already holds.
  useEffect(() => {
    if (selectedKey && !availableFarms.some((farm) => farm.event === selectedKey)) {
      setSelectedKey('');
    }
  }, [availableFarms, selectedKey]);

  function handleAdd() {
    if (selectedKey) onAdd(selectedKey);
  }

  return (
    <Panel>
      <Header>
        <div>
          <Title>Build My Roadmap</Title>
          <Description>
            Add farms, then move them into your preferred priority order. Your roadmap is saved on this device.
          </Description>
        </div>
        <Count>{roadmap.length} selected</Count>
      </Header>

      <AddRow>
        <FarmPicker
          farms={availableFarms}
          value={selectedKey}
          onChange={setSelectedKey}
        />
        <Button type="button" onClick={handleAdd} disabled={!selectedKey}>
          ADD FARM
        </Button>
      </AddRow>

      {roadmap.length > 0 && (
        <OrderedList aria-label="Selected farm priority">
          {roadmap.map((farm, index) => {
            const requirement = getPoolRequirement(farm);

            return (
              <RoadmapItem key={farm.event}>
                <FarmRow>
                  <Priority aria-label={`Priority ${index + 1}`}>{index + 1}</Priority>
                  {farm.reward.icon && <RewardIcon src={farm.reward.icon} alt="" />}
                  <FarmInfo>
                    <FarmName>{farm.reward.name}</FarmName>
                    <EventName>{farm.event}</EventName>
                  </FarmInfo>
                  <Controls>
                    <SmallButton
                      type="button"
                      variant="ghost"
                      onClick={() => onMove(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${farm.reward.name} up`}
                      title="Move up"
                    >
                      ↑
                    </SmallButton>
                    <SmallButton
                      type="button"
                      variant="ghost"
                      onClick={() => onMove(index, 1)}
                      disabled={index === roadmap.length - 1}
                      aria-label={`Move ${farm.reward.name} down`}
                      title="Move down"
                    >
                      ↓
                    </SmallButton>
                    <RemoveButton
                      type="button"
                      variant="ghost"
                      onClick={() => onRemove(farm.event)}
                      aria-label={`Remove ${farm.reward.name}`}
                    >
                      REMOVE
                    </RemoveButton>
                  </Controls>
                </FarmRow>

                {requirement && (
                  <PoolSquadPicker
                    units={getFarmUnits(farm)}
                    requirement={requirement}
                    rewardName={farm.reward.name}
                    selectedUnitIds={farm.selectedUnitIds ?? []}
                    onToggle={(unitId) => onTogglePoolUnit(farm.event, unitId)}
                  />
                )}
              </RoadmapItem>
            );
          })}
        </OrderedList>
      )}
    </Panel>
  );
}

const Panel = styled.section`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.space[10]};
  margin-bottom: ${({ theme }) => theme.space[10]};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[8]};
  margin-bottom: ${({ theme }) => theme.space[8]};
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.gold};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  margin-top: ${({ theme }) => theme.space[2]};
`;

const Count = styled.span`
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.blue};
  background: ${({ theme }) => theme.colors.infoSoft};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[5]}`};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const AddRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[5]};

  ${({ theme }) => theme.media.phone} {
    flex-direction: column;
  }
`;

const OrderedList = styled.ol`
  display: grid;
  gap: ${({ theme }) => theme.space[4]};
  margin-top: ${({ theme }) => theme.space[8]};
  padding: 0;
  list-style: none;
`;

const RoadmapItem = styled.li`
  background: ${({ theme }) => theme.colors.sunken};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

const FarmRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[5]};
  padding: ${({ theme }) => theme.space[5]};

  ${({ theme }) => theme.media.phone} {
    flex-wrap: wrap;
  }
`;

const Priority = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.round};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const RewardIcon = styled.img`
  width: 42px;
  height: 42px;
  border-radius: ${({ theme }) => theme.radii.sm};
  object-fit: cover;
`;

const FarmInfo = styled.div`
  flex: 1 1 180px;
  min-width: 0;
`;

const FarmName = styled.div`
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const EventName = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Controls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
`;

const SmallButton = styled(Button)`
  min-width: ${({ theme }) => theme.sizes.tap};
  padding: ${({ theme }) => theme.space[3]};
`;

const RemoveButton = styled(Button)`
  padding: ${({ theme }) => `${theme.space[3]} ${theme.space[5]}`};
  color: ${({ theme }) => theme.colors.red};
`;

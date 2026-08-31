import { useEffect, useMemo, useState } from 'react';
import { allFarmsRoadmap } from '../data/allFarmsRoadmap';
import {
  getDefaultPoolUnitIds,
  getPoolRequirement,
  sanitizePoolChoices
} from '../data/poolRequirements';
import { loadMyRoadmap, saveMyRoadmap } from '../utils/myRoadmapStorage';

function farmKey(farm) {
  return farm.event;
}

const farmIndex = new Map(allFarmsRoadmap.map((farm) => [farmKey(farm), farm]));

function initializeRoadmap() {
  const stored = loadMyRoadmap();
  const poolChoices = { ...stored.poolChoices };

  stored.farmKeys.forEach((key) => {
    const farm = farmIndex.get(key);
    if (!getPoolRequirement(farm)) return;

    const saved = sanitizePoolChoices(farm, poolChoices[key]);
    poolChoices[key] = saved.length > 0 ? saved : getDefaultPoolUnitIds(farm);
  });

  return { farmKeys: stored.farmKeys, poolChoices };
}

export function useMyRoadmap() {
  const [config, setConfig] = useState(initializeRoadmap);
  const { farmKeys, poolChoices } = config;

  useEffect(() => {
    saveMyRoadmap(config);
  }, [config]);

  const roadmap = useMemo(
    () => farmKeys
      .map((key) => {
        const farm = farmIndex.get(key);
        if (!farm) return null;
        return getPoolRequirement(farm)
          ? { ...farm, selectedUnitIds: poolChoices[key] ?? [] }
          : farm;
      })
      .filter(Boolean),
    [farmKeys, poolChoices]
  );

  const availableFarms = useMemo(() => {
    const selected = new Set(farmKeys);
    return allFarmsRoadmap.filter((farm) => !selected.has(farmKey(farm)));
  }, [farmKeys]);

  function addFarm(key) {
    if (!farmIndex.has(key)) return;
    setConfig((current) => {
      if (current.farmKeys.includes(key)) return current;

      const farm = farmIndex.get(key);
      return {
        farmKeys: [...current.farmKeys, key],
        poolChoices: getPoolRequirement(farm)
          ? { ...current.poolChoices, [key]: getDefaultPoolUnitIds(farm) }
          : current.poolChoices
      };
    });
  }

  function removeFarm(key) {
    setConfig((current) => ({
      farmKeys: current.farmKeys.filter((farm) => farm !== key),
      poolChoices: Object.fromEntries(
        Object.entries(current.poolChoices).filter(([event]) => event !== key)
      )
    }));
  }

  function moveFarm(index, direction) {
    setConfig((current) => {
      const destination = index + direction;
      if (
        index < 0 ||
        index >= current.farmKeys.length ||
        destination < 0 ||
        destination >= current.farmKeys.length
      ) {
        return current;
      }

      const next = [...current.farmKeys];
      [next[index], next[destination]] = [next[destination], next[index]];
      return { ...current, farmKeys: next };
    });
  }

  /**
   * `seedIds` is the squad currently in effect, which matters for a
   * prerequisite journey the player has never edited: the first toggle has to
   * adjust the automatic pick rather than start from an empty squad.
   */
  function togglePoolUnit(event, unitId, seedIds = []) {
    const farm = farmIndex.get(event);
    const requirement = getPoolRequirement(farm);
    if (!requirement) return;

    setConfig((current) => {
      const stored = current.poolChoices[event];
      const selected = sanitizePoolChoices(farm, stored ?? seedIds);
      const isSelected = selected.includes(unitId);
      if (!isSelected && selected.length >= requirement.count) return current;

      return {
        ...current,
        poolChoices: {
          ...current.poolChoices,
          [event]: isSelected
            ? selected.filter((id) => id !== unitId)
            : [...selected, unitId]
        }
      };
    });
  }

  return {
    roadmap,
    poolChoices,
    availableFarms,
    addFarm,
    removeFarm,
    moveFarm,
    togglePoolUnit
  };
}

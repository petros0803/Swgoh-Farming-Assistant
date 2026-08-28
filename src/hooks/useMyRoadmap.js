import { useEffect, useMemo, useState } from 'react';
import { allFarmsRoadmap } from '../data/allFarmsRoadmap';
import { loadMyRoadmapKeys, saveMyRoadmapKeys } from '../utils/myRoadmapStorage';

function farmKey(farm) {
  return farm.event;
}

const farmIndex = new Map(allFarmsRoadmap.map((farm) => [farmKey(farm), farm]));

export function useMyRoadmap() {
  const [farmKeys, setFarmKeys] = useState(loadMyRoadmapKeys);

  useEffect(() => {
    saveMyRoadmapKeys(farmKeys);
  }, [farmKeys]);

  const roadmap = useMemo(
    () => farmKeys.map((key) => farmIndex.get(key)).filter(Boolean),
    [farmKeys]
  );

  const availableFarms = useMemo(() => {
    const selected = new Set(farmKeys);
    return allFarmsRoadmap.filter((farm) => !selected.has(farmKey(farm)));
  }, [farmKeys]);

  function addFarm(key) {
    if (!farmIndex.has(key)) return;
    setFarmKeys((current) => current.includes(key) ? current : [...current, key]);
  }

  function removeFarm(key) {
    setFarmKeys((current) => current.filter((farm) => farm !== key));
  }

  function moveFarm(index, direction) {
    setFarmKeys((current) => {
      const destination = index + direction;
      if (index < 0 || index >= current.length || destination < 0 || destination >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  return { roadmap, availableFarms, addFarm, removeFarm, moveFarm };
}

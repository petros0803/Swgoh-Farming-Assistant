import {
  loadMyRoadmap,
  MY_ROADMAP_STORAGE_KEY,
  saveMyRoadmap
} from './myRoadmapStorage';

describe('my roadmap storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and restores ordered, unique farm keys', () => {
    saveMyRoadmap({
      farmKeys: ['Discarded Doctrine', 'Rebel with a cause'],
      poolChoices: {}
    });

    expect(loadMyRoadmap()).toEqual({
      farmKeys: ['Discarded Doctrine', 'Rebel with a cause'],
      poolChoices: {}
    });
  });

  it('saves and restores the squad picked for a faction-pool event', () => {
    saveMyRoadmap({
      farmKeys: ['Contact Protocol'],
      poolChoices: {
        'Contact Protocol': ['PAPLOO', 'WICKET', 'WICKET', 'LOGRAY']
      }
    });

    expect(loadMyRoadmap().poolChoices).toEqual({
      'Contact Protocol': ['PAPLOO', 'WICKET', 'LOGRAY']
    });
  });

  it('reads a version 1 roadmap and leaves squad choices unset', () => {
    window.localStorage.setItem(
      MY_ROADMAP_STORAGE_KEY,
      JSON.stringify({ version: 1, farmKeys: ['Contact Protocol'] })
    );

    expect(loadMyRoadmap()).toEqual({
      farmKeys: ['Contact Protocol'],
      poolChoices: {}
    });
  });

  it('returns an empty roadmap for malformed or unsupported data', () => {
    window.localStorage.setItem(MY_ROADMAP_STORAGE_KEY, '{bad json');
    expect(loadMyRoadmap()).toEqual({ farmKeys: [], poolChoices: {} });

    window.localStorage.setItem(
      MY_ROADMAP_STORAGE_KEY,
      JSON.stringify({ version: 3, farmKeys: ['Discarded Doctrine'] })
    );
    expect(loadMyRoadmap()).toEqual({ farmKeys: [], poolChoices: {} });
  });
});

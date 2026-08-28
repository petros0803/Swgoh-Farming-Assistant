import {
  loadMyRoadmapKeys,
  MY_ROADMAP_STORAGE_KEY,
  saveMyRoadmapKeys
} from './myRoadmapStorage';

describe('my roadmap storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and restores ordered, unique farm keys', () => {
    saveMyRoadmapKeys(['Discarded Doctrine', 'Rebel with a cause']);

    expect(loadMyRoadmapKeys()).toEqual([
      'Discarded Doctrine',
      'Rebel with a cause'
    ]);
  });

  it('returns an empty roadmap for malformed or unsupported data', () => {
    window.localStorage.setItem(MY_ROADMAP_STORAGE_KEY, '{bad json');
    expect(loadMyRoadmapKeys()).toEqual([]);

    window.localStorage.setItem(
      MY_ROADMAP_STORAGE_KEY,
      JSON.stringify({ version: 2, farmKeys: ['Discarded Doctrine'] })
    );
    expect(loadMyRoadmapKeys()).toEqual([]);
  });
});

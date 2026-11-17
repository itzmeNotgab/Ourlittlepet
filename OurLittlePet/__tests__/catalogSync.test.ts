import { CATALOG } from '../src/data/catalog';
import * as server from '../functions/src/catalog';

describe('catalog', () => {
  it('app and Cloud Functions catalogs match exactly', () => {
    const app = CATALOG.map(i => [i.category, i.id, i.unlockAt]);
    expect(server.CATALOG).toEqual(app);
  });
  it('has unique category:id keys and starter items', () => {
    const keys = CATALOG.map(i => `${i.category}:${i.id}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(server.unlockedAt(0)).toContain('head:bow');
    expect(server.unlockedAt(0)).toContain('wallpaper:pink');
  });
  it('unlocks more items as affection grows', () => {
    expect(server.unlockedAt(100).length).toBeGreaterThan(server.unlockedAt(10).length);
  });
});

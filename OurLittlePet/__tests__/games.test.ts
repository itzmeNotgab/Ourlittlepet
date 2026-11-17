import { buildDeck, isMatch, SYMBOLS } from '../src/games/memoryLogic';
import { stepHearts } from '../src/games/heartLogic';
import { levelInfo } from '../src/utils/levels';

describe('memory match', () => {
  it('builds a shuffled deck with exactly two of each symbol', () => {
    const d = buildDeck(); expect(d).toHaveLength(SYMBOLS.length * 2);
    for (const s of SYMBOLS) expect(d.filter(x => x === s)).toHaveLength(2);
  });
  it('matches only different cards with same face', () => {
    const d = ['a', 'a', 'b']; expect(isMatch(d, 0, 1)).toBe(true); expect(isMatch(d, 0, 0)).toBe(false); expect(isMatch(d, 0, 2)).toBe(false);
  });
});
describe('heart catcher', () => {
  it('catches hearts inside the basket and scores gold as 3', () => {
    const r = stepHearts([{ id: 1, x: 100, y: 440, v: 100, gold: false }, { id: 2, x: 110, y: 440, v: 100, gold: true }], 0.1, 100, 45, 450, 600);
    expect(r.gained).toBe(4); expect(r.hearts).toHaveLength(0);
  });
  it('misses hearts far from the basket and drops off-screen ones', () => {
    const r = stepHearts([{ id: 1, x: 300, y: 440, v: 100, gold: false }, { id: 2, x: 10, y: 640, v: 100, gold: false }], 0.1, 100, 45, 450, 600);
    expect(r.gained).toBe(0); expect(r.hearts).toHaveLength(1);
  });
});
describe('levels', () => {
  it('computes level and progress', () => {
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(10).level).toBe(2);
    expect(levelInfo(400).progress).toBe(1);
  });
});

import { applyDecay, deriveMood, FLOOR } from '../src/utils/petMath';
import * as server from '../functions/src/petMath';

const H = 3600000;
describe('pet math', () => {
  it('never decays below the comfy floor (no punishment for missed days)', () => {
    const s = applyDecay({ fullness: 60, happiness: 60, energy: 60 }, false, 200 * H);
    expect(s.fullness).toBe(FLOOR); expect(s.happiness).toBe(FLOOR); expect(s.energy).toBe(FLOOR);
  });
  it('does not push stats that are already lower', () => {
    expect(applyDecay({ fullness: 10, happiness: 10, energy: 10 }, false, 10 * H).fullness).toBe(10);
  });
  it('recovers energy while sleeping', () => {
    expect(applyDecay({ fullness: 80, happiness: 80, energy: 40 }, true, 2 * H).energy).toBeCloseTo(70);
  });
  it('derives moods', () => {
    expect(deriveMood({ fullness: 30, happiness: 90, energy: 90 }, false)).toBe('hungry');
    expect(deriveMood({ fullness: 90, happiness: 90, energy: 90 }, false)).toBe('excited');
    expect(deriveMood({ fullness: 90, happiness: 90, energy: 90 }, true)).toBe('sleeping');
  });
  it('client and server implementations agree', () => {
    const s = { fullness: 77, happiness: 64, energy: 52 };
    for (const sl of [true, false]) for (const h of [0, 1, 5, 30]) {
      expect(applyDecay(s, sl, h * H)).toEqual(server.applyDecay(s, sl, h * H));
      expect(deriveMood(s, sl)).toBe(server.deriveMood(s, sl));
    }
  });
});

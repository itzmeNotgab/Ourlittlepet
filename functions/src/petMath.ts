// Mirror of src/utils/petMath.ts (kept identical; a unit test checks they agree).
export const FLOOR = 30;
export interface Stats { fullness: number; happiness: number; energy: number }
export type Mood = 'idle' | 'happy' | 'hungry' | 'sleepy' | 'excited' | 'sleeping';
const clamp = (v: number) => Math.max(0, Math.min(100, v));
const dec = (v: number, d: number) => (v <= FLOOR ? v : Math.max(FLOOR, v - d));

/** Gentle decay: never punishes missed days (stats stop falling at FLOOR). */
export function applyDecay(s: Stats, sleeping: boolean, elapsedMs: number): Stats {
  const h = Math.max(0, Math.min(elapsedMs, 48 * 3600000)) / 3600000;
  if (sleeping) return { fullness: dec(s.fullness, h * 0.8), happiness: s.happiness, energy: clamp(s.energy + h * 15) };
  return { fullness: dec(s.fullness, h * 2), happiness: dec(s.happiness, h * 1.5), energy: dec(s.energy, h * 1.5) };
}

export function deriveMood(s: Stats, sleeping: boolean): Mood {
  if (sleeping) return 'sleeping';
  if (s.fullness < 45) return 'hungry';
  if (s.energy < 40) return 'sleepy';
  const avg = (s.fullness + s.happiness + s.energy) / 3;
  if (avg >= 85) return 'excited';
  if (s.happiness >= 65) return 'happy';
  return 'idle';
}
export const clampStat = clamp;

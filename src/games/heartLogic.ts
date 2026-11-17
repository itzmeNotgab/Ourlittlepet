export interface FallingHeart { id: number; x: number; y: number; v: number; gold: boolean }
export const GAME_MS = 30000;

/** Pure physics step so it can be unit-tested. Returns remaining hearts + points gained this step. */
export function stepHearts(hs: FallingHeart[], dtSec: number, basketX: number, basketHalfW: number, basketTop: number, areaH: number) {
  let gained = 0;
  const next: FallingHeart[] = [];
  for (const h of hs) {
    const y = h.y + h.v * dtSec;
    if (y >= basketTop && y <= basketTop + 34 && Math.abs(h.x - basketX) <= basketHalfW + 12) { gained += h.gold ? 3 : 1; continue; }
    if (y > areaH + 20) continue;
    next.push({ ...h, y });
  }
  return { hearts: next, gained };
}

export function spawnHeart(id: number, areaW: number, rand: () => number = Math.random): FallingHeart {
  return { id, x: 24 + rand() * (areaW - 48), y: -24, v: 150 + rand() * 170, gold: rand() < 0.12 };
}

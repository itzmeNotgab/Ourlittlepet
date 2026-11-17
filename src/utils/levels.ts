import { LEVEL_THRESHOLDS } from '../config/app';

export function levelInfo(points: number) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) if (points >= LEVEL_THRESHOLDS[i]) level = i + 1;
  const cur = LEVEL_THRESHOLDS[level - 1];
  const next = level < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[level] : null;
  return { level, current: cur, next, progress: next ? (points - cur) / (next - cur) : 1 };
}

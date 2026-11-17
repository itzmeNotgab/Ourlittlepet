import type { LastAction } from '../types';
import { FOODS } from '../data/catalog';

export function timeLabel(ms: number | null): string {
  if (!ms) return '';
  const d = new Date(ms);
  const hh = d.getHours() % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
}
export function dayLabel(ms: number | null): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const isValidDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());

export function describeAction(a: Pick<LastAction, 'type' | 'detail'>, petName: string): string {
  switch (a.type) {
    case 'feed': return `fed ${petName} ${a.detail && FOODS[a.detail] ? FOODS[a.detail].emoji : '🥕'}`;
    case 'pet': return `petted ${petName} 💗`;
    case 'play': return `played with ${petName} 🎾`;
    case 'sleep': return `put ${petName} to bed 🌙`;
    case 'wake': return `woke ${petName} up ☀️`;
    case 'rename': return `renamed the cat to ${a.detail}`;
    case 'equip': return `changed ${petName}'s outfit 🎀`;
    case 'game': return `played ${a.detail === 'heart' ? 'Heart Catcher' : 'Memory Match'} 🎮`;
    default: return a.type;
  }
}

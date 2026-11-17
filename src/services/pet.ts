import { call } from './functions';
import type { ActionResult } from '../types';

export const feed = (foodId: string) => call<ActionResult>('petAction', { type: 'feed', foodId });
export const pet = () => call<ActionResult>('petAction', { type: 'pet' });
export const play = () => call<ActionResult>('petAction', { type: 'play' });
export const sleep = () => call<ActionResult>('petAction', { type: 'sleep' });
export const wake = () => call<ActionResult>('petAction', { type: 'wake' });
export const rename = (name: string) => call<ActionResult>('petAction', { type: 'rename', name });
export const equip = (slot: string, itemId: string | null) => call<ActionResult>('petAction', { type: 'equip', slot, itemId });
export const updateBedroom = (category: string, value: string) => call('updateBedroom', { category, value });
export const claimGameReward = (p: { game: 'heart' | 'memory'; score?: number; durationMs: number; moves?: number }) =>
  call<{ awarded: number; capped: boolean; newUnlocks: string[]; food: string | null }>('claimGameReward', p);

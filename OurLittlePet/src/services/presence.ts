import database from '@react-native-firebase/database';
import { AppState } from 'react-native';
import type { PresenceState } from '../types';

const TS = () => database.ServerValue.TIMESTAMP;

/** Publishes MY presence. onDisconnect is registered server-side, so crashes/network loss mark me offline. */
export function startPresence(roomId: string, uid: string): () => void {
  const ref = database().ref(`presence/${roomId}/${uid}`);
  const conn = database().ref('.info/connected');
  const handler = conn.on('value', async snap => {
    if (snap.val() === true) {
      try {
        await ref.onDisconnect().set({ state: 'offline', lastChanged: TS() });
        await ref.set({ state: AppState.currentState === 'active' ? 'online' : 'away', lastChanged: TS() });
      } catch {}
    }
  });
  const sub = AppState.addEventListener('change', s => {
    ref.set({ state: s === 'active' ? 'online' : 'away', lastChanged: TS() }).catch(() => {});
  });
  return () => {
    conn.off('value', handler);
    sub.remove();
    ref.set({ state: 'offline', lastChanged: TS() }).catch(() => {});
  };
}

export interface RawPresence { state: 'online' | 'away' | 'offline'; lastChanged: number }

export function watchPresence(roomId: string, uid: string, cb: (p: RawPresence | null) => void) {
  const ref = database().ref(`presence/${roomId}/${uid}`);
  const h = ref.on('value', s => cb(s.val() as RawPresence | null), () => cb(null));
  return () => ref.off('value', h);
}

export function watchConnection(cb: (connected: boolean) => void) {
  const ref = database().ref('.info/connected');
  const h = ref.on('value', s => cb(s.val() === true));
  return () => ref.off('value', h);
}

export function toPresenceState(p: RawPresence | null, nowMs: number): PresenceState {
  if (!p) return 'offline';
  if (p.state === 'online') return 'online';
  return nowMs - p.lastChanged < 5 * 60 * 1000 ? 'recent' : 'offline';
}

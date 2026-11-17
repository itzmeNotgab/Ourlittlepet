import AsyncStorage from '@react-native-async-storage/async-storage';
import { call } from './functions';

export const codeKey = (roomId: string) => `pairing-code:${roomId}`;

export async function createRoom() {
  const r = await call<{ roomId: string; code: string; expiresAt: number }>('createRoom');
  await AsyncStorage.setItem(codeKey(r.roomId), JSON.stringify({ code: r.code, expiresAt: r.expiresAt }));
  return r;
}
export const requestJoin = (code: string) => call<{ ok: boolean }>('requestJoin', { code });
export const approveJoin = (roomId: string) => call('approveJoin', { roomId });
export const rejectJoin = (roomId: string) => call('rejectJoin', { roomId });
export const cancelRoom = (roomId: string) => call('cancelRoom', { roomId });
export const cancelJoinRequest = () => call('cancelJoinRequest');
export const unlinkRoom = (roomId: string) => call('unlinkRoom', { roomId, confirm: true });

export async function loadStoredCode(roomId: string): Promise<{ code: string; expiresAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(codeKey(roomId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

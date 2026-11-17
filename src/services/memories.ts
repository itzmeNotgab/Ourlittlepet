import firestore from '@react-native-firebase/firestore';
import type { Memory } from '../types';
import { deleteImage } from './images';

export function watchMemories(roomId: string, cb: (m: Memory[]) => void, onError: (e: Error) => void) {
  return firestore().collection(`rooms/${roomId}/memories`).orderBy('date', 'desc').onSnapshot(
    snap => cb(snap.docs.map(d => {
      const x = d.data({ serverTimestamps: 'estimate' }) as any;
      return { id: d.id, ...x, createdAtMs: x.createdAt ? x.createdAt.toMillis() : null } as Memory;
    })),
    e => onError(e),
  );
}

export function addMemory(roomId: string, m: { authorId: string; authorName: string; imageUrl: string; storagePath: string; caption: string; note: string; date: string }) {
  return firestore().collection(`rooms/${roomId}/memories`).add({ ...m, createdAt: firestore.FieldValue.serverTimestamp() });
}
export function updateMemory(roomId: string, id: string, p: { caption: string; note: string; date: string }) {
  return firestore().doc(`rooms/${roomId}/memories/${id}`).update(p);
}
export async function deleteMemory(roomId: string, m: Memory) {
  await firestore().doc(`rooms/${roomId}/memories/${m.id}`).delete();
  await deleteImage(m.storagePath);
}

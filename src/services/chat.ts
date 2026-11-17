import firestore from '@react-native-firebase/firestore';
import type { Message } from '../types';

export function watchMessages(roomId: string, cb: (m: Message[]) => void, onError: (e: Error) => void) {
  return firestore()
    .collection(`rooms/${roomId}/messages`)
    .orderBy('createdAt', 'desc')
    .limit(60)
    .onSnapshot(
      { includeMetadataChanges: true },
      snap => {
        cb(
          snap.docs.map(d => {
            const data = d.data() as any;
            return {
              id: d.id, from: data.from, text: data.text ?? '', imageUrl: data.imageUrl,
              createdAtMs: data.createdAt ? data.createdAt.toMillis() : null,
              pending: d.metadata.hasPendingWrites,
            } as Message;
          }),
        );
      },
      e => onError(e),
    );
}

/** Fire-and-forget safe: the promise resolves only after the SERVER accepts the write. */
export function sendMessage(roomId: string, uid: string, text: string, imageUrl?: string) {
  return firestore().collection(`rooms/${roomId}/messages`).add({
    from: uid, text, ...(imageUrl ? { imageUrl } : {}), createdAt: firestore.FieldValue.serverTimestamp(),
  });
}

export function markRead(roomId: string, uid: string) {
  return firestore().doc(`rooms/${roomId}/readState/${uid}`).set({ lastRead: firestore.FieldValue.serverTimestamp() });
}

export function watchReadState(roomId: string, uid: string, cb: (ms: number) => void) {
  return firestore().doc(`rooms/${roomId}/readState/${uid}`).onSnapshot(
    s => { const t = s.exists ? (s.get('lastRead') as any) : null; cb(t ? t.toMillis() : 0); },
    () => {},
  );
}

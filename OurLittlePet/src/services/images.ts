import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';

export async function pickImage(): Promise<string | null> {
  const res = await launchImageLibrary({ mediaType: 'photo', maxWidth: 1400, maxHeight: 1400, quality: 0.8, selectionLimit: 1 });
  if (res.didCancel) return null;
  if (res.errorCode) throw new Error(res.errorMessage || 'Could not open your photos.');
  return res.assets?.[0]?.uri ?? null;
}

export async function uploadImage(roomId: string, kind: 'memories' | 'chat', uid: string, uri: string) {
  const path = `rooms/${roomId}/${kind}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const ref = storage().ref(path);
  await ref.putFile(uri, { contentType: 'image/jpeg', customMetadata: { owner: uid } });
  const url = await ref.getDownloadURL();
  return { url, path };
}

export async function deleteImage(path: string) {
  try { await storage().ref(path).delete(); } catch {}
}

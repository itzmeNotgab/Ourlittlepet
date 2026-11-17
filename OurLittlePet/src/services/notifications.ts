import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { PermissionsAndroid, Platform } from 'react-native';

async function saveToken(uid: string, token: string) {
  await firestore().doc(`users/${uid}/private/tokens`).set({ tokens: firestore.FieldValue.arrayUnion(token) }, { merge: true });
}

/** Asks for permission (Android 13+), registers the FCM token, returns an unsubscribe fn. */
export async function registerForPush(uid: string): Promise<() => void> {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (r !== PermissionsAndroid.RESULTS.GRANTED) return () => {};
    }
    const token = await messaging().getToken();
    await saveToken(uid, token);
    return messaging().onTokenRefresh(t => { saveToken(uid, t).catch(() => {}); });
  } catch {
    return () => {};
  }
}

export async function unregisterPush(uid: string) {
  try {
    const token = await messaging().getToken();
    await firestore().doc(`users/${uid}/private/tokens`).set({ tokens: firestore.FieldValue.arrayRemove(token) }, { merge: true });
    await messaging().deleteToken();
  } catch {}
}

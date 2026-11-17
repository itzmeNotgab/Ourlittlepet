import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '../config/app';

export function configureGoogle() {
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
}

export async function ensureProfile(user: FirebaseAuthTypes.User) {
  const ref = firestore().doc(`users/${user.uid}`);
  const snap = await ref.get();
  const displayName = user.displayName ?? 'Friend';
  const photoURL = user.photoURL ?? null;
  if (!snap.exists) {
    await ref.set({
      displayName, photoURL, createdAt: firestore.FieldValue.serverTimestamp(),
      prefs: { messages: true, pet: true, rewards: true, pairing: true },
    });
  } else if (snap.get('displayName') !== displayName || snap.get('photoURL') !== photoURL) {
    await ref.update({ displayName, photoURL });
  }
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();
  const idToken = res.data?.idToken;
  if (!idToken) throw new Error('Sign-in was cancelled.');
  const cred = auth.GoogleAuthProvider.credential(idToken);
  const uc = await auth().signInWithCredential(cred);
  await ensureProfile(uc.user);
}

export async function signOutAll() {
  try { await GoogleSignin.signOut(); } catch {}
  await auth().signOut();
}

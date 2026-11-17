import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { configureGoogle, ensureProfile } from './services/auth';
import { WorldProvider } from './context/World';
import { Cat } from './components/Cat';
import { Screen } from './components/ui';
import LoginScreen from './screens/LoginScreen';
import PairingScreen from './screens/PairingScreen';
import PairingSuccess from './screens/PairingSuccess';
import MainNavigator from './navigation/MainTabs';
import type { Profile } from './types';
import { colors } from './theme';

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.cream, card: colors.cream, primary: colors.purple, text: colors.text } };

function Splash() {
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Cat state="idle" equipped={{ head: 'bow', back: null, cape: null, companion: null }} size={160} />
        <ActivityIndicator color={colors.pinkDeep} style={{ marginTop: 18 }} />
      </View>
    </Screen>
  );
}

function Root() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [showSuccess, setShowSuccess] = useState(false);
  const prevRoom = useRef<string | null | undefined>(undefined);

  useEffect(() => { configureGoogle(); return auth().onAuthStateChanged(setUser); }, []);

  useEffect(() => {
    if (!user) { setProfile(undefined); prevRoom.current = undefined; return; }
    return firestore().doc(`users/${user.uid}`).onSnapshot(
      s => {
        if (s.exists) setProfile(s.data() as Profile);
        else { setProfile(null); ensureProfile(user).catch(() => {}); }
      },
      () => {},
    );
  }, [user]);

  // Show the pairing-success animation only when a room appears while we were in the pairing flow.
  useEffect(() => {
    if (profile === undefined) return;
    const cur = profile?.roomId ?? null;
    if (prevRoom.current === null && cur) setShowSuccess(true);
    prevRoom.current = cur;
  }, [profile]);

  if (user === undefined) return <Splash />;
  if (!user) return <LoginScreen />;
  if (!profile) return <Splash />;
  if (!profile.roomId) return <PairingScreen uid={user.uid} profile={profile} />;

  return (
    <WorldProvider uid={user.uid} roomId={profile.roomId} profile={profile}>
      {showSuccess ? (
        <PairingSuccess onDone={() => setShowSuccess(false)} />
      ) : (
        <NavigationContainer theme={navTheme}>
          <MainNavigator prefs={profile.prefs} />
        </NavigationContainer>
      )}
    </WorldProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Root />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

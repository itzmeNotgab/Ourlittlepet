import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Cat } from '../components/Cat';
import { FloatingHearts } from '../components/Hearts';
import { Body, Button, H1, Screen } from '../components/ui';
import { signInWithGoogle } from '../services/auth';
import { colors } from '../theme';

export default function LoginScreen() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async () => {
    setBusy(true); setErr('');
    try { await signInWithGoogle(); } catch (e: any) { setErr(e?.message ?? 'Sign-in failed. Please try again.'); }
    setBusy(false);
  };
  return (
    <Screen>
      <FloatingHearts count={10} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Cat state="happy" equipped={{ head: 'bow', back: null, cape: null, companion: null }} size={230} />
        <H1>OUR LITTLE PET</H1>
        <Body style={{ textAlign: 'center', color: colors.muted, marginTop: 6, marginBottom: 28 }}>A tiny private world for two.</Body>
        <Button title="Continue with Google" onPress={go} loading={busy} style={{ alignSelf: 'stretch' }} />
        {err ? <Text style={{ color: colors.danger, marginTop: 12, textAlign: 'center' }}>{err}</Text> : null}
      </View>
    </Screen>
  );
}

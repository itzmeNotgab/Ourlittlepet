import React from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Avatar, Body, Button, Card, H2, Screen } from '../components/ui';
import { useWorld } from '../context/World';
import { signOutAll } from '../services/auth';
import { unregisterPush } from '../services/notifications';
import { unlinkRoom } from '../services/pairing';
import type { Prefs } from '../types';
import { colors } from '../theme';

const PREF_ROWS: { key: keyof Prefs; label: string }[] = [
  { key: 'messages', label: 'Messages' }, { key: 'pet', label: 'Pet interactions' },
  { key: 'rewards', label: 'Rewards & unlocks' }, { key: 'pairing', label: 'Pairing & world events' },
];

export default function SettingsScreen({ prefs }: { prefs?: Prefs }) {
  const w = useWorld();
  const setPref = (key: keyof Prefs, v: boolean) =>
    firestore().doc(`users/${w.uid}`).update({ [`prefs.${key}`]: v }).catch(e => w.toast(e?.message ?? 'Could not save.'));

  const unlink = () => Alert.alert(
    'Unlink Our World?',
    'You and your person will no longer share this pet, room, chat or new memories.\n\nNothing is deleted: your messages and memories are kept safely and stay readable (read-only) for both of you.',
    [
      { text: 'Keep our world', style: 'cancel' },
      { text: 'Unlink', style: 'destructive', onPress: () => w.run(() => unlinkRoom(w.roomId)) },
    ],
  );
  const logout = async () => { await unregisterPush(w.uid); await signOutAll(); };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <H2>Settings ⚙️</H2>
        <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Avatar uri={w.me.photoURL} name={w.me.displayName} size={56} status={w.presence.me} />
          <View style={{ marginLeft: 14 }}>
            <Text style={{ fontWeight: '800', fontSize: 17, color: colors.text }}>{w.me.displayName}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Paired with {w.partner?.displayName ?? '…'}</Text>
          </View>
        </Card>

        <Card style={{ marginTop: 14 }}>
          <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 6 }}>Notifications</Text>
          {PREF_ROWS.map(r => (
            <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: colors.text }}>{r.label}</Text>
              <Switch value={prefs?.[r.key] !== false} onValueChange={v => setPref(r.key, v)} trackColor={{ true: colors.pinkDeep, false: colors.lavender }} />
            </View>
          ))}
        </Card>

        <Card style={{ marginTop: 14 }}>
          <Text style={{ fontWeight: '800', color: colors.text }}>Connection</Text>
          <Body style={{ color: w.connected ? colors.success : colors.warn }}>{w.connected ? '● Connected' : '● Offline: showing saved data'}</Body>
        </Card>

        <Button title="Sign out" variant="soft" onPress={logout} style={{ marginTop: 18 }} />
        <Button title="Unlink Our World" variant="danger" onPress={unlink} style={{ marginTop: 10 }} />
      </ScrollView>
    </Screen>
  );
}

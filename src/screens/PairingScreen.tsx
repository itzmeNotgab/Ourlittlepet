import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import firestore from '@react-native-firebase/firestore';
import { Avatar, Body, Button, Card, H1, H2, Screen } from '../components/ui';
import { Cat } from '../components/Cat';
import { FloatingHearts } from '../components/Hearts';
import { approveJoin, cancelJoinRequest, cancelRoom, createRoom, loadStoredCode, rejectJoin, requestJoin } from '../services/pairing';
import { signOutAll } from '../services/auth';
import type { Profile, RoomDoc } from '../types';
import { colors, radius } from '../theme';

function useCountdown(expiresAt?: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = expiresAt ? Math.max(0, expiresAt - now) : 0;
  return { left, label: `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}` };
}

function CreatorView({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const { left, label } = useCountdown(expiresAt);

  useEffect(() => firestore().doc(`rooms/${roomId}`).onSnapshot(s => setRoom(s.exists ? (s.data() as RoomDoc) : null), () => {}), [roomId]);
  useEffect(() => {
    loadStoredCode(roomId).then(c => { if (c) { setCode(c.code); setExpiresAt(c.expiresAt); } });
  }, [roomId]);
  useEffect(() => { if (room?.codeExpiresAt) setExpiresAt(room.codeExpiresAt); }, [room?.codeExpiresAt]);

  const act = async (fn: () => Promise<unknown>) => { setBusy(true); setErr(''); try { await fn(); } catch (e: any) { setErr(e.message); } setBusy(false); };
  const regenerate = () => act(async () => { const r = await createRoom(); setCode(r.code); setExpiresAt(r.expiresAt); });
  const pj = room?.pendingJoin;
  const expired = left === 0 && !pj;

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <H1>Your world is waiting 🐱</H1>
      <Body style={{ color: colors.muted, marginBottom: 16 }}>Share this code with your person. It works once and expires in 10 minutes.</Body>
      <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
        {code && !expired ? (
          <>
            <Text selectable style={{ fontSize: 46, fontWeight: '800', letterSpacing: 8, color: colors.purpleDark }}>{code}</Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>Expires in {label}</Text>
            <Button small variant="soft" title={copied ? 'Copied ✓' : 'Copy code'} style={{ marginTop: 14 }}
              onPress={() => { Clipboard.setString(code); setCopied(true); setTimeout(() => setCopied(false), 1800); }} />
          </>
        ) : (
          <>
            <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center', marginBottom: 12 }}>
              {expired ? 'This code has expired.' : 'The code is only shown on the phone that created it.'}
            </Text>
            <Button title="Get a new code" onPress={regenerate} loading={busy} />
          </>
        )}
      </Card>

      {pj ? (
        <Card style={{ marginTop: 18 }}>
          <H2>Someone entered your code 💞</H2>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
            <Avatar uri={pj.photoURL} name={pj.displayName} size={52} />
            <Text style={{ marginLeft: 12, fontSize: 17, fontWeight: '700', color: colors.text }}>{pj.displayName}</Text>
          </View>
          <Body style={{ marginBottom: 12 }}>Only approve if this is your person. Approving pairs your accounts.</Body>
          <Button title="Approve" onPress={() => act(() => approveJoin(roomId))} loading={busy} />
          <Button title="Decline" variant="soft" style={{ marginTop: 8 }} onPress={() => act(() => rejectJoin(roomId))} />
        </Card>
      ) : (
        <Body style={{ textAlign: 'center', marginTop: 18, color: colors.muted }}>Waiting for them to enter the code…</Body>
      )}
      {err ? <Text style={{ color: colors.danger, marginTop: 12, textAlign: 'center' }}>{err}</Text> : null}
      <Button title="Cancel" variant="glass" style={{ marginTop: 22 }} onPress={() => act(() => cancelRoom(roomId))} />
    </ScrollView>
  );
}

function JoinView({ onBack }: { onBack: () => void }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setErr('');
    try { await requestJoin(code); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <View style={{ padding: 20 }}>
      <H1>Join Our World 💌</H1>
      <Body style={{ color: colors.muted, marginBottom: 16 }}>Enter the 6-digit code from your person's phone.</Body>
      <TextInput
        value={code} onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6}
        placeholder="------" placeholderTextColor={colors.lavenderDeep} autoFocus
        style={{ backgroundColor: colors.white, borderRadius: radius.md, fontSize: 40, letterSpacing: 10, textAlign: 'center', paddingVertical: 16, color: colors.purpleDark, fontWeight: '800' }} />
      {err ? <Text style={{ color: colors.danger, marginTop: 10, textAlign: 'center' }}>{err}</Text> : null}
      <Button title="Send request" onPress={submit} disabled={code.length !== 6} loading={busy} style={{ marginTop: 18 }} />
      <Button title="Back" variant="glass" onPress={onBack} style={{ marginTop: 8 }} />
    </View>
  );
}

function WaitingView({ declined }: { declined: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <View style={{ padding: 24, alignItems: 'center' }}>
      <Cat state="sleepy" size={170} />
      <H2>Waiting for approval…</H2>
      <Body style={{ textAlign: 'center', color: colors.muted, marginVertical: 10 }}>
        {declined ? 'Your last request was declined or expired.' : 'Your person needs to tap Approve on their phone.'}
      </Body>
      <Button title="Cancel request" variant="soft" loading={busy} onPress={async () => { setBusy(true); try { await cancelJoinRequest(); } catch {} setBusy(false); }} />
    </View>
  );
}

export default function PairingScreen({ uid, profile }: { uid: string; profile: Profile }) {
  const [mode, setMode] = useState<'choose' | 'join'>('choose');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [declined, setDeclined] = useState(false);
  const prevPending = useRef<string | null | undefined>(profile.pendingRoomId);
  useEffect(() => {
    if (prevPending.current && !profile.pendingRoomId && !profile.roomId) setDeclined(true);
    prevPending.current = profile.pendingRoomId;
  }, [profile.pendingRoomId, profile.roomId]);

  const create = async () => { setBusy(true); setErr(''); try { await createRoom(); } catch (e: any) { setErr(e.message); } setBusy(false); };

  let body: React.ReactNode;
  if (profile.ownPendingRoomId) body = <CreatorView roomId={profile.ownPendingRoomId} />;
  else if (profile.pendingRoomId) body = <WaitingView declined={false} />;
  else if (mode === 'join') body = <JoinView onBack={() => setMode('choose')} />;
  else body = (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
      <Cat state="idle" equipped={{ head: 'bow', back: null, cape: null, companion: null }} size={200} />
      <H1>Hi, {profile.displayName.split(' ')[0]} 💗</H1>
      <Body style={{ textAlign: 'center', color: colors.muted, marginVertical: 10 }}>Create a world for the two of you, or join the one your person made.</Body>
      {declined ? <Text style={{ color: colors.warn, marginBottom: 8 }}>Your last join request was declined or expired.</Text> : null}
      <Button title="Create Our World" onPress={create} loading={busy} style={{ alignSelf: 'stretch' }} />
      <Button title="Join Our World" variant="soft" onPress={() => setMode('join')} style={{ alignSelf: 'stretch', marginTop: 10 }} />
      {err ? <Text style={{ color: colors.danger, marginTop: 10, textAlign: 'center' }}>{err}</Text> : null}
      <Button title="Sign out" variant="glass" small style={{ marginTop: 24 }} onPress={() => signOutAll()} />
    </View>
  );
  return (<Screen><FloatingHearts count={6} />{body}</Screen>);
}

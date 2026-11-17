import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import type { Activity, BedroomDoc, InventoryDoc, LastAction, Message, Person, PetDoc, PetVisual, PresenceState, Profile, RoomDoc } from '../types';
import { watchMessages, watchReadState } from '../services/chat';
import { startPresence, toPresenceState, watchConnection, watchPresence, RawPresence } from '../services/presence';
import { registerForPush } from '../services/notifications';
import { applyDecay, deriveMood, MoodT } from '../utils/petMath';
import { describeAction } from '../utils/format';
import { colors, radius } from '../theme';

export interface Reaction extends LastAction { mine: boolean }
export interface World {
  uid: string; roomId: string;
  me: Person; partner: Person | null;
  room: RoomDoc | null; pet: PetDoc | null; bedroom: BedroomDoc | null; inventory: InventoryDoc | null;
  activities: Activity[];
  points: number;
  stats: { fullness: number; happiness: number; energy: number };
  mood: MoodT; visual: PetVisual;
  presence: { me: PresenceState; partner: PresenceState };
  connected: boolean;
  messages: Message[]; unread: number; partnerReadMs: number;
  reaction: Reaction | null; burst: number;
  busy: boolean;
  toast: (msg: string) => void;
  run: <T>(fn: () => Promise<T>) => Promise<T | null>;
}

const Ctx = createContext<World | null>(null);
export const useWorld = (): World => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useWorld outside WorldProvider');
  return c;
};

export function WorldProvider({ uid, roomId, profile, children }: { uid: string; roomId: string; profile: Profile; children: React.ReactNode }) {
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [pet, setPet] = useState<PetDoc | null>(null);
  const [bedroom, setBedroom] = useState<BedroomDoc | null>(null);
  const [inventory, setInventory] = useState<InventoryDoc | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [rawMe, setRawMe] = useState<RawPresence | null>(null);
  const [rawPartner, setRawPartner] = useState<RawPresence | null>(null);
  const [now, setNow] = useState(Date.now());
  const [connected, setConnected] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [myRead, setMyRead] = useState(0);
  const [partnerReadMs, setPartnerReadMs] = useState(0);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [burst, setBurst] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ id: number; text: string } | null>(null);

  const toast = useCallback((text: string) => setToastMsg({ id: Date.now(), text }), []);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const partnerUid = useMemo(() => room?.members?.find(m => m !== uid) ?? null, [room, uid]);

  // Real-time shared state (Firestore listeners; cached offline by the SDK).
  useEffect(() => {
    const base = firestore().doc(`rooms/${roomId}`);
    const subs = [
      base.onSnapshot(s => setRoom(s.exists ? (s.data() as RoomDoc) : null), () => {}),
      base.collection('pet').doc('main').onSnapshot(s => setPet(s.exists ? (s.data() as PetDoc) : null), () => {}),
      base.collection('bedroom').doc('main').onSnapshot(s => setBedroom(s.exists ? (s.data() as BedroomDoc) : null), () => {}),
      base.collection('inventory').doc('main').onSnapshot(s => setInventory(s.exists ? (s.data() as InventoryDoc) : null), () => {}),
      base.collection('activities').orderBy('atMs', 'desc').limit(30).onSnapshot(
        s => setActivities(s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Activity, 'id'>) }))), () => {}),
    ];
    return () => subs.forEach(u => u());
  }, [roomId]);

  useEffect(() => {
    if (!partnerUid) { setPartnerProfile(null); return; }
    return firestore().doc(`users/${partnerUid}`).onSnapshot(s => setPartnerProfile(s.exists ? (s.data() as Profile) : null), () => {});
  }, [partnerUid]);

  // Presence + connection.
  useEffect(() => startPresence(roomId, uid), [roomId, uid]);
  useEffect(() => watchPresence(roomId, uid, setRawMe), [roomId, uid]);
  useEffect(() => (partnerUid ? watchPresence(roomId, partnerUid, setRawPartner) : undefined), [roomId, partnerUid]);
  useEffect(() => watchConnection(setConnected), []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

  // Chat.
  useEffect(() => watchMessages(roomId, setMessages, () => {}), [roomId]);
  useEffect(() => watchReadState(roomId, uid, setMyRead), [roomId, uid]);
  useEffect(() => (partnerUid ? watchReadState(roomId, partnerUid, setPartnerReadMs) : undefined), [roomId, partnerUid]);

  // Push registration + foreground messages (FCM doesn't draw notifications while the app is open).
  useEffect(() => {
    let off: () => void = () => {};
    registerForPush(uid).then(u => { off = u; });
    const unsub = messaging().onMessage(async m => {
      if (m.notification) toast(`${m.notification.title ?? ''}: ${m.notification.body ?? ''}`);
    });
    return () => { off(); unsub(); };
  }, [uid, toast]);

  // Partner/own action -> reaction + toast (skips the very first snapshot).
  const lastSeq = useRef<number | null>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!pet) return;
    const la = pet.lastAction;
    if (lastSeq.current === null) { lastSeq.current = la?.seq ?? 0; return; }
    if (la && la.seq !== lastSeq.current) {
      lastSeq.current = la.seq;
      setReaction({ ...la, mine: la.by === uid });
      if (['feed', 'pet', 'play'].includes(la.type)) setBurst(b => b + 1);
      if (la.by !== uid) toast(`${la.byName} ${describeAction(la, pet.name)}`);
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      reactionTimer.current = setTimeout(() => setReaction(null), 4500);
    }
  }, [pet, uid, toast]);
  useEffect(() => () => { if (reactionTimer.current) clearTimeout(reactionTimer.current); }, []);

  // New unlocks -> toast.
  const unlockCount = useRef<number | null>(null);
  useEffect(() => {
    if (!inventory) return;
    const n = inventory.unlocked?.length ?? 0;
    if (unlockCount.current !== null && n > unlockCount.current) toast('✨ Something new unlocked in your little world!');
    unlockCount.current = n;
  }, [inventory, toast]);

  const stats = useMemo(() => {
    if (!pet) return { fullness: 80, happiness: 80, energy: 80 };
    return applyDecay({ fullness: pet.fullness, happiness: pet.happiness, energy: pet.energy }, pet.sleeping, now - (pet.updatedAtMs ?? now));
  }, [pet, now]);
  const mood = deriveMood(stats, !!pet?.sleeping);
  const visual: PetVisual = useMemo(() => {
    if (reaction) {
      if (reaction.type === 'feed') return 'eating';
      if (reaction.type === 'pet') return 'petted';
      if (reaction.type === 'play') return 'playing';
    }
    return pet?.sleeping ? 'sleeping' : mood;
  }, [reaction, pet, mood]);

  const me: Person = { uid, displayName: profile.displayName, photoURL: profile.photoURL };
  const partnerFallback = partnerUid ? room?.memberProfiles?.[partnerUid] : undefined;
  const partner: Person | null = partnerUid
    ? { uid: partnerUid, displayName: partnerProfile?.displayName ?? partnerFallback?.displayName ?? 'Your person', photoURL: partnerProfile?.photoURL ?? partnerFallback?.photoURL ?? null }
    : null;

  const unread = useMemo(() => messages.filter(m => m.from !== uid && m.createdAtMs && m.createdAtMs > myRead).length, [messages, uid, myRead]);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setBusy(true);
    try { return await fn(); } catch (e: any) { toast(e?.message ?? 'Something went wrong.'); return null; } finally { setBusy(false); }
  }, [toast]);

  const value: World = {
    uid, roomId, me, partner, room, pet, bedroom, inventory, activities,
    points: room?.affection?.points ?? 0, stats, mood, visual,
    presence: { me: toPresenceState(rawMe, now), partner: toPresenceState(rawPartner, now) },
    connected, messages, unread, partnerReadMs, reaction, burst, busy, toast, run,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {toastMsg && (
        <Animated.View key={toastMsg.id} entering={FadeInDown} exiting={FadeOutUp} pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toast}><Text style={styles.toastText}>{toastMsg.text}</Text></View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', top: 54, left: 16, right: 16, alignItems: 'center' },
  toast: { backgroundColor: colors.purpleDark, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 10, maxWidth: '100%' },
  toastText: { color: colors.white, fontWeight: '600', fontSize: 13 },
});

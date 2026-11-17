import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Transaction } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { getMessaging } from 'firebase-admin/messaging';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { createHash, randomInt } from 'crypto';
import { CATALOG, WARDROBE, SINGLE, MULTI, FOODS, STARTER_FOODS, unlockedAt, POINTS, COOLDOWN_MS } from './catalog';
import { applyDecay, deriveMood, clampStat } from './petMath';

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });
const db = getFirestore();

const CODE_TTL_MS = 10 * 60 * 1000;
const APPROVE_WINDOW_MS = 30 * 60 * 1000;
const RL_WINDOW_MS = 15 * 60 * 1000;
const RL_MAX_FAILS = 5;
const RL_LOCK_MS = 30 * 60 * 1000;

// ---------- helpers ----------
const needAuth = (req: CallableRequest): string => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Please sign in first.');
  return req.auth.uid;
};
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
type Prefs = { messages?: boolean; pet?: boolean; rewards?: boolean; pairing?: boolean };

async function notify(uid: string, kind: keyof Prefs, title: string, body: string, tag?: string) {
  try {
    const u = await db.doc(`users/${uid}`).get();
    const prefs = (u.get('prefs') ?? {}) as Prefs;
    if (prefs[kind] === false) return;
    const t = await db.doc(`users/${uid}/private/tokens`).get();
    const tokens: string[] = t.get('tokens') ?? [];
    if (!tokens.length) return;
    const res = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { kind },
      android: { priority: 'high', notification: tag ? { tag } : {} },
    });
    const bad = tokens.filter((_, i) => {
      const code = res.responses[i].error?.code;
      return code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token';
    });
    if (bad.length) await db.doc(`users/${uid}/private/tokens`).update({ tokens: FieldValue.arrayRemove(...bad) });
  } catch (e) {
    console.warn('notify failed', kind, e);
  }
}

async function deleteCodesFor(roomId: string) {
  const q = await db.collection('pairingCodes').where('roomId', '==', roomId).get();
  const batch = db.batch();
  q.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

// ---------- pairing ----------
async function cancelPendingRoom(roomId: string) {
  const roomRef = db.doc(`rooms/${roomId}`);
  const snap = await roomRef.get();
  if (!snap.exists || snap.get('status') !== 'pending') return;
  const joiner = snap.get('pendingJoin.uid') as string | undefined;
  const creator = snap.get('creatorUid') as string;
  const batch = db.batch();
  batch.delete(roomRef);
  batch.update(db.doc(`users/${creator}`), { ownPendingRoomId: FieldValue.delete() });
  if (joiner) batch.update(db.doc(`users/${joiner}`), { pendingRoomId: FieldValue.delete() });
  await batch.commit();
  await deleteCodesFor(roomId);
}

export const createRoom = onCall(async req => {
  const uid = needAuth(req);
  const userRef = db.doc(`users/${uid}`);
  const user = await userRef.get();
  if (!user.exists) throw new HttpsError('failed-precondition', 'Profile not ready yet. Try again in a moment.');
  if (user.get('roomId')) throw new HttpsError('already-exists', 'You are already in a world.');
  if (user.get('pendingRoomId')) throw new HttpsError('failed-precondition', 'You already have a pending join request.');
  const prev = user.get('ownPendingRoomId') as string | undefined;
  if (prev) await cancelPendingRoom(prev);

  const roomRef = db.collection('rooms').doc();
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0'); // CSPRNG
    const codeRef = db.doc(`pairingCodes/${sha(code)}`);
    const expiresAt = Date.now() + CODE_TTL_MS;
    const ok = await db.runTransaction(async tx => {
      const existing = await tx.get(codeRef);
      if (existing.exists && (existing.get('expiresAt') as number) > Date.now()) return false;
      tx.set(codeRef, { roomId: roomRef.id, creatorUid: uid, expiresAt, used: false });
      tx.set(roomRef, {
        status: 'pending', creatorUid: uid, members: [uid], pendingJoin: null,
        codeExpiresAt: expiresAt, createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(userRef, { ownPendingRoomId: roomRef.id });
      return true;
    });
    if (ok) return { roomId: roomRef.id, code, expiresAt };
  }
  throw new HttpsError('resource-exhausted', 'Could not generate a code. Please try again.');
});

export const requestJoin = onCall(async req => {
  const uid = needAuth(req);
  const code = String(req.data?.code ?? '');
  if (!/^\d{6}$/.test(code)) throw new HttpsError('invalid-argument', 'Enter the 6-digit code.');
  const rlRef = db.doc(`rateLimits/${uid}`);
  const userRef = db.doc(`users/${uid}`);
  const codeRef = db.doc(`pairingCodes/${sha(code)}`);

  const result = await db.runTransaction(async (tx: Transaction) => {
    const now = Date.now();
    const [rl, user, codeSnap] = await Promise.all([tx.get(rlRef), tx.get(userRef), tx.get(codeRef)]);
    let fails = (rl.get('fails') as number) ?? 0;
    let windowStart = (rl.get('windowStart') as number) ?? now;
    const lockedUntil = (rl.get('lockedUntil') as number) ?? 0;
    if (lockedUntil > now) return { err: 'locked' as const, until: lockedUntil };
    if (!user.exists) return { err: 'profile' as const };
    if (user.get('roomId') || user.get('pendingRoomId') || user.get('ownPendingRoomId')) return { err: 'busy' as const };

    const fail = () => {
      if (now - windowStart > RL_WINDOW_MS) { fails = 0; windowStart = now; }
      fails += 1;
      const lock = fails >= RL_MAX_FAILS ? now + RL_LOCK_MS : 0;
      tx.set(rlRef, { fails: lock ? 0 : fails, windowStart, lockedUntil: lock });
      return { err: 'invalid' as const };
    };

    if (!codeSnap.exists || codeSnap.get('used') || (codeSnap.get('expiresAt') as number) < now) return fail();
    const roomRef = db.doc(`rooms/${codeSnap.get('roomId')}`);
    const room = await tx.get(roomRef);
    if (!room.exists || room.get('status') !== 'pending') return fail();
    if (room.get('creatorUid') === uid) return { err: 'own' as const };
    if (room.get('pendingJoin')) return { err: 'taken' as const };

    tx.update(roomRef, {
      pendingJoin: {
        uid, displayName: user.get('displayName') ?? 'Someone', photoURL: user.get('photoURL') ?? null, requestedAt: now,
      },
    });
    tx.update(userRef, { pendingRoomId: roomRef.id });
    tx.set(rlRef, { fails: 0, windowStart: now, lockedUntil: 0 });
    return { ok: true as const, creator: room.get('creatorUid') as string, name: (user.get('displayName') as string) ?? 'Someone' };
  });

  if ('ok' in result) {
    await notify(result.creator, 'pairing', 'Someone wants to join your world 💞', `${result.name} entered your code. Open the app to approve.`);
    return { ok: true };
  }
  switch (result.err) {
    case 'locked': throw new HttpsError('resource-exhausted', 'Too many wrong codes. Please wait a while and try again.');
    case 'busy': throw new HttpsError('failed-precondition', 'You are already linked or waiting for a world.');
    case 'own': throw new HttpsError('failed-precondition', 'That is your own code. Share it with your partner.');
    case 'taken': throw new HttpsError('failed-precondition', 'Someone already used this code and is waiting for approval.');
    case 'profile': throw new HttpsError('failed-precondition', 'Profile not ready yet. Try again in a moment.');
    default: throw new HttpsError('not-found', 'That code is invalid or expired.');
  }
});

export const cancelJoinRequest = onCall(async req => {
  const uid = needAuth(req);
  await db.runTransaction(async tx => {
    const userRef = db.doc(`users/${uid}`);
    const user = await tx.get(userRef);
    const roomId = user.get('pendingRoomId') as string | undefined;
    if (!roomId) return;
    const roomRef = db.doc(`rooms/${roomId}`);
    const room = await tx.get(roomRef);
    if (room.exists && room.get('pendingJoin.uid') === uid) tx.update(roomRef, { pendingJoin: null });
    tx.update(userRef, { pendingRoomId: FieldValue.delete() });
  });
  return { ok: true };
});

export const rejectJoin = onCall(async req => {
  const uid = needAuth(req);
  const roomId = String(req.data?.roomId ?? '');
  await db.runTransaction(async tx => {
    const roomRef = db.doc(`rooms/${roomId}`);
    const room = await tx.get(roomRef);
    if (!room.exists || room.get('creatorUid') !== uid || room.get('status') !== 'pending') throw new HttpsError('permission-denied', 'Not allowed.');
    const joiner = room.get('pendingJoin.uid') as string | undefined;
    if (!joiner) return;
    tx.update(roomRef, { pendingJoin: null });
    tx.update(db.doc(`users/${joiner}`), { pendingRoomId: FieldValue.delete() });
  });
  return { ok: true };
});

export const cancelRoom = onCall(async req => {
  const uid = needAuth(req);
  const roomId = String(req.data?.roomId ?? '');
  const room = await db.doc(`rooms/${roomId}`).get();
  if (!room.exists || room.get('creatorUid') !== uid) throw new HttpsError('permission-denied', 'Not allowed.');
  await cancelPendingRoom(roomId);
  return { ok: true };
});

export const approveJoin = onCall(async req => {
  const uid = needAuth(req);
  const roomId = String(req.data?.roomId ?? '');
  const roomRef = db.doc(`rooms/${roomId}`);

  const joinerUid = await db.runTransaction(async tx => {
    const room = await tx.get(roomRef);
    if (!room.exists || room.get('creatorUid') !== uid || room.get('status') !== 'pending') throw new HttpsError('permission-denied', 'Not allowed.');
    const pj = room.get('pendingJoin') as { uid: string; displayName: string; photoURL: string | null; requestedAt: number } | null;
    if (!pj) throw new HttpsError('failed-precondition', 'Nobody is waiting to join.');
    if (Date.now() - pj.requestedAt > APPROVE_WINDOW_MS) throw new HttpsError('deadline-exceeded', 'This request is too old. Ask them to try again.');
    const creatorRef = db.doc(`users/${uid}`);
    const joinerRef = db.doc(`users/${pj.uid}`);
    const [creator, joiner] = await Promise.all([tx.get(creatorRef), tx.get(joinerRef)]);
    if (creator.get('roomId') || joiner.get('roomId')) throw new HttpsError('failed-precondition', 'One of you is already in an active world.');

    const now = Date.now();
    tx.update(roomRef, {
      status: 'active', members: [uid, pj.uid], pendingJoin: FieldValue.delete(),
      memberProfiles: {
        [uid]: { displayName: creator.get('displayName') ?? 'You', photoURL: creator.get('photoURL') ?? null },
        [pj.uid]: { displayName: pj.displayName, photoURL: pj.photoURL },
      },
      affection: { points: 0, cooldowns: {} }, activatedAt: now,
    });
    tx.update(creatorRef, { roomId, ownPendingRoomId: FieldValue.delete() });
    tx.update(joinerRef, { roomId, pendingRoomId: FieldValue.delete() });
    tx.set(roomRef.collection('pet').doc('main'), {
      name: 'Mochi', fullness: 80, happiness: 80, energy: 80, mood: 'happy', sleeping: false,
      equipped: { head: 'bow', back: null, cape: null, companion: null },
      lastAction: null, seq: 0, updatedAtMs: now,
    });
    tx.set(roomRef.collection('bedroom').doc('main'), {
      wallpaper: 'pink', floor: 'wood', bed: 'pinkBed', rug: 'roundPink', lighting: 'warm', window: 'day', theme: 'none',
      items: ['furniture:teddy', 'plant:pot'], lastChange: null,
    });
    tx.set(roomRef.collection('inventory').doc('main'), { foods: STARTER_FOODS, unlocked: unlockedAt(0) });
    return pj.uid;
  });

  await deleteCodesFor(roomId); // code is invalid the moment pairing succeeds
  await getDatabase().ref(`roomMembers/${roomId}`).set({ [uid]: true, [joinerUid]: true });
  await notify(joinerUid, 'pairing', 'Your little world is ready 🐱', 'You were approved. Come meet your cat!');
  return { ok: true };
});

export const unlinkRoom = onCall(async req => {
  const uid = needAuth(req);
  if (req.data?.confirm !== true) throw new HttpsError('failed-precondition', 'Confirmation required.');
  const roomId = String(req.data?.roomId ?? '');
  const roomRef = db.doc(`rooms/${roomId}`);
  const partner = await db.runTransaction(async tx => {
    const room = await tx.get(roomRef);
    const members = (room.get('members') ?? []) as string[];
    if (!room.exists || room.get('status') !== 'active' || !members.includes(uid)) throw new HttpsError('permission-denied', 'Not allowed.');
    // Data is NEVER deleted: the room is archived and both people keep read-only access.
    tx.update(roomRef, { status: 'unlinked', formerMembers: members, members: [], unlinkedBy: uid, unlinkedAt: Date.now() });
    for (const m of members) tx.update(db.doc(`users/${m}`), { roomId: FieldValue.delete(), archivedRoomIds: FieldValue.arrayUnion(roomId) });
    return members.find(m => m !== uid);
  });
  await getDatabase().ref(`roomMembers/${roomId}`).remove();
  if (partner) await notify(partner, 'pairing', 'Your world was unlinked', 'Your shared memories and messages are kept safe (read-only).');
  return { ok: true };
});

// ---------- pet ----------
const ACTION_EMOJI: Record<string, string> = { feed: 'fed', pet: 'petted', play: 'played with', sleep: 'put to bed', wake: 'woke up' };

export const petAction = onCall(async req => {
  const uid = needAuth(req);
  const type = String(req.data?.type ?? '');
  const user = await db.doc(`users/${uid}`).get();
  const roomId = user.get('roomId') as string | undefined;
  if (!roomId) throw new HttpsError('failed-precondition', 'You are not in a world yet.');
  const roomRef = db.doc(`rooms/${roomId}`);
  const petRef = roomRef.collection('pet').doc('main');
  const invRef = roomRef.collection('inventory').doc('main');

  const out = await db.runTransaction(async tx => {
    const [room, petSnap, invSnap] = await Promise.all([tx.get(roomRef), tx.get(petRef), tx.get(invRef)]);
    const members = (room.get('members') ?? []) as string[];
    if (!room.exists || room.get('status') !== 'active' || !members.includes(uid)) throw new HttpsError('permission-denied', 'Not allowed.');
    if (!petSnap.exists) throw new HttpsError('failed-precondition', 'Pet missing.');
    const now = Date.now();
    const byName: string = room.get(`memberProfiles.${uid}.displayName`) ?? 'Someone';
    const pet = petSnap.data() as any;
    const foods: Record<string, number> = { ...(invSnap.get('foods') ?? {}) };
    const unlocked: string[] = [...(invSnap.get('unlocked') ?? [])];

    let s = applyDecay({ fullness: pet.fullness, happiness: pet.happiness, energy: pet.energy }, !!pet.sleeping, now - (pet.updatedAtMs ?? now));
    let sleeping: boolean = !!pet.sleeping;
    let name: string = pet.name;
    let equipped = { ...(pet.equipped ?? {}) };
    let detail: string | undefined;
    const cooldownKey = type;

    switch (type) {
      case 'feed': {
        if (sleeping) throw new HttpsError('failed-precondition', 'Shh, your cat is sleeping.');
        const foodId = String(req.data?.foodId ?? '');
        const food = FOODS[foodId];
        if (!food) throw new HttpsError('invalid-argument', 'Unknown food.');
        if (!food.basic) {
          if ((foods[foodId] ?? 0) < 1) throw new HttpsError('failed-precondition', 'You are out of that food. Play a game to earn more!');
          foods[foodId] = foods[foodId] - 1;
        }
        s = { ...s, fullness: clampStat(s.fullness + food.fullness), happiness: clampStat(s.happiness + food.happiness) };
        detail = foodId; break;
      }
      case 'pet':
        if (sleeping) throw new HttpsError('failed-precondition', 'Shh, your cat is sleeping.');
        s = { ...s, happiness: clampStat(s.happiness + 4) }; break;
      case 'play':
        if (sleeping) throw new HttpsError('failed-precondition', 'Shh, your cat is sleeping.');
        if (s.energy < 15) throw new HttpsError('failed-precondition', 'Too sleepy to play. Time for a nap!');
        s = { fullness: clampStat(s.fullness - 5), happiness: clampStat(s.happiness + 12), energy: clampStat(s.energy - 10) }; break;
      case 'sleep':
        if (sleeping) throw new HttpsError('failed-precondition', 'Already asleep.');
        sleeping = true; break;
      case 'wake':
        if (!sleeping) throw new HttpsError('failed-precondition', 'Already awake.');
        sleeping = false; break;
      case 'rename': {
        const n = String(req.data?.name ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
        if (n.length < 1 || n.length > 16) throw new HttpsError('invalid-argument', 'Name must be 1-16 characters.');
        name = n; detail = n; break;
      }
      case 'equip': {
        const slot = String(req.data?.slot ?? '');
        const itemId = req.data?.itemId == null ? null : String(req.data.itemId);
        if (!WARDROBE.includes(slot)) throw new HttpsError('invalid-argument', 'Bad slot.');
        if (itemId !== null && !unlocked.includes(`${slot}:${itemId}`)) throw new HttpsError('failed-precondition', 'That item is still locked.');
        equipped[slot] = itemId; detail = `${slot}:${itemId ?? ''}`; break;
      }
      default: throw new HttpsError('invalid-argument', 'Unknown action.');
    }

    // affection (cooperative, cooldown-limited so spam can't farm it)
    const affection = (room.get('affection') ?? { points: 0, cooldowns: {} }) as { points: number; cooldowns: Record<string, number> };
    let awarded = 0;
    const pts = POINTS[cooldownKey] ?? 0;
    if (pts && now - (affection.cooldowns?.[cooldownKey] ?? 0) >= COOLDOWN_MS[cooldownKey]) {
      awarded = pts;
      affection.points += pts;
      affection.cooldowns = { ...(affection.cooldowns ?? {}), [cooldownKey]: now };
    }
    const nowUnlocked = unlockedAt(affection.points);
    const newUnlocks = nowUnlocked.filter(k => !unlocked.includes(k));

    const mood = deriveMood(s, sleeping);
    const seq = (pet.seq ?? 0) + 1;
    tx.update(petRef, {
      name, fullness: s.fullness, happiness: s.happiness, energy: s.energy, mood, sleeping, equipped,
      seq, updatedAtMs: now, lastAction: { by: uid, byName, type, detail: detail ?? null, seq, atMs: now },
    });
    tx.update(invRef, { foods, unlocked: [...unlocked, ...newUnlocks] });
    const notifyOk = now - ((room.get('lastPetNotifyAt') as number) ?? 0) > 5 * 60 * 1000 && !!ACTION_EMOJI[type];
    tx.update(roomRef, { affection, ...(notifyOk ? { lastPetNotifyAt: now } : {}) });
    tx.set(roomRef.collection('activities').doc(), {
      by: uid, byName, type, detail: detail ?? null, atMs: now, points: awarded,
      after: { fullness: s.fullness, happiness: s.happiness, energy: s.energy, mood },
    });
    const partner = members.find(m => m !== uid);
    return { awarded, newUnlocks, notifyOk, partner, byName, name, members };
  });

  if (out.notifyOk && out.partner) {
    await notify(out.partner, 'pet', out.name, `${out.byName} ${ACTION_EMOJI[type]} ${out.name} 💕`, 'pet-' + roomId);
  }
  if (out.newUnlocks.length) {
    for (const m of out.members) await notify(m, 'rewards', 'Something new unlocked ✨', `${out.newUnlocks.length} new item(s) for your little world!`, 'reward-' + roomId);
  }
  return { awarded: out.awarded, newUnlocks: out.newUnlocks };
});

// ---------- bedroom ----------
export const updateBedroom = onCall(async req => {
  const uid = needAuth(req);
  const category = String(req.data?.category ?? '');
  const value = String(req.data?.value ?? '');
  const user = await db.doc(`users/${uid}`).get();
  const roomId = user.get('roomId') as string | undefined;
  if (!roomId) throw new HttpsError('failed-precondition', 'You are not in a world yet.');
  if (!CATALOG.some(e => e[0] === category && e[1] === value)) throw new HttpsError('invalid-argument', 'Unknown item.');
  const roomRef = db.doc(`rooms/${roomId}`);
  const bedRef = roomRef.collection('bedroom').doc('main');
  const invRef = roomRef.collection('inventory').doc('main');
  await db.runTransaction(async tx => {
    const [room, bed, inv] = await Promise.all([tx.get(roomRef), tx.get(bedRef), tx.get(invRef)]);
    const members = (room.get('members') ?? []) as string[];
    if (!room.exists || room.get('status') !== 'active' || !members.includes(uid)) throw new HttpsError('permission-denied', 'Not allowed.');
    const key = `${category}:${value}`;
    if (!((inv.get('unlocked') ?? []) as string[]).includes(key)) throw new HttpsError('failed-precondition', 'That item is still locked.');
    const lastChange = { by: uid, byName: room.get(`memberProfiles.${uid}.displayName`) ?? 'Someone', atMs: Date.now(), what: category };
    if (SINGLE.includes(category)) {
      tx.update(bedRef, { [category]: value, lastChange });
    } else if (MULTI.includes(category)) {
      const items = new Set<string>((bed.get('items') ?? []) as string[]);
      if (items.has(key)) items.delete(key);
      else { if (items.size >= 14) throw new HttpsError('failed-precondition', 'The room is full! Remove something first.'); items.add(key); }
      tx.update(bedRef, { items: [...items], lastChange });
    } else throw new HttpsError('invalid-argument', 'Not a room category.');
  });
  return { ok: true };
});

// ---------- mini-game rewards (server-validated, capped) ----------
export const claimGameReward = onCall(async req => {
  const uid = needAuth(req);
  const game = String(req.data?.game ?? '');
  const score = Number(req.data?.score ?? 0);
  const durationMs = Number(req.data?.durationMs ?? 0);
  const moves = Number(req.data?.moves ?? 0);
  if (!['heart', 'memory'].includes(game)) throw new HttpsError('invalid-argument', 'Unknown game.');
  if (![score, durationMs, moves].every(Number.isFinite)) throw new HttpsError('invalid-argument', 'Bad result.');
  if (game === 'heart' && (score < 0 || score > 120 || durationMs < 25000 || durationMs > 45000)) throw new HttpsError('invalid-argument', 'That result does not look right.');
  if (game === 'memory' && (moves < 8 || moves > 80 || durationMs < 8000 || durationMs > 900000)) throw new HttpsError('invalid-argument', 'That result does not look right.');

  const user = await db.doc(`users/${uid}`).get();
  const roomId = user.get('roomId') as string | undefined;
  if (!roomId) throw new HttpsError('failed-precondition', 'You are not in a world yet.');
  const roomRef = db.doc(`rooms/${roomId}`);
  const invRef = roomRef.collection('inventory').doc('main');
  const limRef = roomRef.collection('gameLimits').doc(uid);
  const DAILY_CAP = 3, MIN_GAP_MS = 60_000;

  const out = await db.runTransaction(async tx => {
    const [room, inv, lim] = await Promise.all([tx.get(roomRef), tx.get(invRef), tx.get(limRef)]);
    const members = (room.get('members') ?? []) as string[];
    if (!room.exists || room.get('status') !== 'active' || !members.includes(uid)) throw new HttpsError('permission-denied', 'Not allowed.');
    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const rec = (lim.get(game) ?? { day, count: 0, last: 0 }) as { day: string; count: number; last: number };
    if (rec.day !== day) { rec.day = day; rec.count = 0; }
    if (rec.count >= DAILY_CAP || now - rec.last < MIN_GAP_MS) return { awarded: 0, capped: true, newUnlocks: [] as string[], food: null as string | null };

    const awarded = game === 'heart' ? Math.min(8, Math.floor(score / 6)) : Math.max(2, 10 - Math.floor((moves - 8) / 2));
    rec.count += 1; rec.last = now;
    tx.set(limRef, { [game]: rec }, { merge: true });

    const affection = (room.get('affection') ?? { points: 0, cooldowns: {} }) as { points: number; cooldowns: Record<string, number> };
    affection.points += awarded;
    const unlocked = [...((inv.get('unlocked') ?? []) as string[])];
    const newUnlocks = unlockedAt(affection.points).filter(k => !unlocked.includes(k));
    const foods: Record<string, number> = { ...(inv.get('foods') ?? {}) };
    const bonusFoods = ['strawberry', 'cupcake', 'cookie'];
    const food = awarded > 0 ? bonusFoods[randomInt(0, bonusFoods.length)] : null;
    if (food) foods[food] = (foods[food] ?? 0) + 1;
    tx.update(roomRef, { affection });
    tx.update(invRef, { foods, unlocked: [...unlocked, ...newUnlocks] });
    tx.set(roomRef.collection('activities').doc(), {
      by: uid, byName: room.get(`memberProfiles.${uid}.displayName`) ?? 'Someone', type: 'game', detail: game, atMs: now, points: awarded, after: null,
    });
    return { awarded, capped: false, newUnlocks, food };
  });
  return out;
});

// ---------- notifications / housekeeping ----------
export const onMessageCreated = onDocumentCreated('rooms/{roomId}/messages/{msgId}', async event => {
  const data = event.data?.data();
  if (!data) return;
  const room = await db.doc(`rooms/${event.params.roomId}`).get();
  const members = (room.get('members') ?? []) as string[];
  const to = members.find(m => m !== data.from);
  if (!to) return;
  const fromName = room.get(`memberProfiles.${data.from}.displayName`) ?? 'Your person';
  await notify(to, 'messages', fromName, data.text ? String(data.text).slice(0, 120) : '📷 Photo', 'msg-' + event.params.roomId);
});

export const cleanupPairing = onSchedule('every 60 minutes', async () => {
  const now = Date.now();
  const expired = await db.collection('pairingCodes').where('expiresAt', '<', now - 60 * 60 * 1000).get();
  for (const d of expired.docs) {
    const roomId = d.get('roomId') as string;
    await cancelPendingRoom(roomId);
    await d.ref.delete();
  }
});

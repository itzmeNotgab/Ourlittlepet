import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Body, Button, Card, Chip, Empty, H2, Screen, StatBar } from '../components/ui';
import { Cat } from '../components/Cat';
import { HeartBurst } from '../components/Hearts';
import { RoomScene } from '../components/RoomScene';
import { QuickActions } from '../components/PetActions';
import { useWorld } from '../context/World';
import { itemsIn, WARDROBE_SLOTS, Slot, keyOf } from '../data/catalog';
import * as petApi from '../services/pet';
import { MOOD_LABEL } from '../utils/petMath';
import { levelInfo } from '../utils/levels';
import { describeAction, timeLabel, dayLabel } from '../utils/format';
import type { Equipped } from '../types';
import { colors, radius } from '../theme';

const SLOT_LABEL: Record<Slot, string> = { head: 'Head', back: 'Back', cape: 'Cape', companion: 'Companions' };

function Wardrobe() {
  const w = useWorld();
  const [slot, setSlot] = useState<Slot>('head');
  const [preview, setPreview] = useState<Equipped | null>(null);
  const eq = w.pet?.equipped ?? { head: null, back: null, cape: null, companion: null };
  const shown: Equipped = preview ?? eq;
  const unlocked = new Set(w.inventory?.unlocked ?? []);
  const list = itemsIn(slot);
  const previewId = preview?.[slot] ?? null;

  const equip = async (id: string | null) => {
    const r = await w.run(() => petApi.equip(slot, id));
    if (r) setPreview(null);
  };
  return (
    <View>
      <View style={{ alignItems: 'center', marginBottom: 8 }}><Cat state="happy" equipped={shown} size={200} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {WARDROBE_SLOTS.map(s => <Chip key={s} label={SLOT_LABEL[s]} active={slot === s} onPress={() => { setSlot(s); setPreview(null); }} />)}
      </ScrollView>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {list.map(it => {
          const open = unlocked.has(keyOf(it.category, it.id));
          const worn = eq[slot] === it.id;
          const sel = previewId === it.id;
          return (
            <Pressable key={it.id} onPress={() => open ? setPreview({ ...eq, [slot]: it.id }) : w.toast(`🔒 Unlocks at ${it.unlockAt} affection`)}
              style={{ width: '31%', backgroundColor: sel ? colors.pink : colors.white, borderRadius: radius.md, padding: 10, alignItems: 'center', marginBottom: 10, borderWidth: worn ? 2 : 0, borderColor: colors.purple, opacity: open ? 1 : 0.5 }}>
              <Text style={{ fontSize: 28 }}>{open ? it.emoji : '🔒'}</Text>
              <Text numberOfLines={1} style={{ fontSize: 11, color: colors.text, marginTop: 2, fontWeight: '600' }}>{it.name}</Text>
              <Text style={{ fontSize: 10, color: colors.muted }}>{worn ? 'Wearing' : open ? 'Tap to preview' : `${it.unlockAt} pts`}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Button title="Equip" disabled={!previewId || w.busy} onPress={() => equip(previewId)} style={{ flex: 1, marginRight: 6 }} />
        <Button title="Unequip" variant="soft" disabled={!eq[slot] || w.busy} onPress={() => equip(null)} style={{ flex: 1, marginLeft: 6 }} />
      </View>
    </View>
  );
}

function History() {
  const w = useWorld();
  if (!w.activities.length) return <Empty emoji="🐾" title="No activity yet" text="Feed, pet or play with your cat to start your story." />;
  return (
    <View>
      {w.activities.map(a => (
        <Card key={a.id} style={{ marginBottom: 8, padding: 12 }}>
          <Text style={{ color: colors.text }}>{a.by === w.uid ? 'You' : a.byName} {describeAction(a, w.pet?.name ?? 'Mochi')}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{dayLabel(a.atMs)} · {timeLabel(a.atMs)}{a.points ? ` · +${a.points} affection` : ''}</Text>
        </Card>
      ))}
    </View>
  );
}

export default function PetScreen() {
  const nav = useNavigation<any>();
  const w = useWorld();
  const [tab, setTab] = useState<'care' | 'wardrobe' | 'history'>('care');
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const sleeping = !!w.pet?.sleeping;
  const lv = levelInfo(w.points);

  const saveName = async () => {
    const r = await w.run(() => petApi.rename(name.trim()));
    if (r) setRenaming(false);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => { setName(w.pet?.name ?? ''); setRenaming(true); }}>
            <H2>{w.pet?.name ?? 'Mochi'} ✏️</H2>
          </Pressable>
          <Text style={{ color: colors.purpleDark, fontWeight: '700' }}>{MOOD_LABEL[w.visual]}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginVertical: 10 }}>
          <Chip label="Care" active={tab === 'care'} onPress={() => setTab('care')} />
          <Chip label="Wardrobe" active={tab === 'wardrobe'} onPress={() => setTab('wardrobe')} />
          <Chip label="Activity" active={tab === 'history'} onPress={() => setTab('history')} />
        </View>

        {tab === 'care' && (
          <>
            <RoomScene room={w.bedroom} night={sleeping} height={300}>
              <Cat state={w.visual} equipped={w.pet?.equipped} size={210} />
              <HeartBurst nonce={w.burst} />
            </RoomScene>
            {sleeping && <Body style={{ textAlign: 'center', marginTop: 8, color: colors.muted }}>🌙 {w.pet?.name} is sleeping and recovering energy.</Body>}
            <Card style={{ marginTop: 14 }}>
              <StatBar label="Fullness (hunger)" value={w.stats.fullness} color="#FFB86B" />
              <StatBar label="Happiness" value={w.stats.happiness} color={colors.pinkDeep} />
              <StatBar label="Energy" value={w.stats.energy} color="#7BC9E8" />
              <StatBar label={`Affection · Level ${lv.level}`} value={lv.progress * 100} color={colors.purple} />
              <Body style={{ color: colors.muted, fontSize: 12 }}>Stats drift gently and never drop below a comfy level, so missed days are never punished.</Body>
            </Card>
            <View style={{ marginTop: 14 }}><QuickActions /></View>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <Button small variant="soft" title="❤️ Heart Catcher" onPress={() => nav.navigate('HeartCatcher')} style={{ flex: 1, marginRight: 6 }} />
              <Button small variant="soft" title="🃏 Memory Match" onPress={() => nav.navigate('MemoryMatch')} style={{ flex: 1, marginLeft: 6 }} />
            </View>
          </>
        )}
        {tab === 'wardrobe' && <Wardrobe />}
        {tab === 'history' && <History />}
      </ScrollView>

      <Modal visible={renaming} transparent animationType="fade" onRequestClose={() => setRenaming(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(74,59,92,0.45)', justifyContent: 'center', padding: 24 }}>
          <Card>
            <H2>Rename your cat</H2>
            <TextInput value={name} onChangeText={setName} maxLength={16} autoFocus placeholder="Name"
              style={{ backgroundColor: colors.cream, borderRadius: radius.md, padding: 12, marginVertical: 12, fontSize: 18, color: colors.text }} />
            <Button title="Save" onPress={saveName} disabled={!name.trim() || w.busy} />
            <Button title="Cancel" variant="soft" onPress={() => setRenaming(false)} style={{ marginTop: 8 }} />
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}

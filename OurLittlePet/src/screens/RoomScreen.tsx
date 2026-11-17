import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Body, Chip, Screen, H2 } from '../components/ui';
import { Cat } from '../components/Cat';
import { RoomScene } from '../components/RoomScene';
import { useWorld } from '../context/World';
import { itemsIn, keyOf, MULTI_CATEGORIES, SINGLE_CATEGORIES } from '../data/catalog';
import * as petApi from '../services/pet';
import { dayLabel, timeLabel } from '../utils/format';
import { colors, radius } from '../theme';

const CATS = [...SINGLE_CATEGORIES, ...MULTI_CATEGORIES];
const LABEL: Record<string, string> = {
  wallpaper: 'Wallpaper', floor: 'Floor', bed: 'Bed', rug: 'Rug', lighting: 'Lighting', window: 'Window', theme: 'Theme',
  furniture: 'Furniture', plant: 'Plants', decor: 'Decor',
};

export default function RoomScreen() {
  const w = useWorld();
  const [cat, setCat] = useState<string>('wallpaper');
  const unlocked = new Set(w.inventory?.unlocked ?? []);
  const multi = (MULTI_CATEGORIES as readonly string[]).includes(cat);
  const bed: any = w.bedroom ?? {};
  const placed = new Set(w.bedroom?.items ?? []);
  const last = w.bedroom?.lastChange;

  const pick = async (id: string) => { await w.run(() => petApi.updateBedroom(cat, id)); };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        <H2>Our Room 🛏️</H2>
        <View style={{ marginTop: 10 }}>
          <RoomScene room={w.bedroom} night={w.pet?.sleeping} height={280}>
            <Cat state={w.visual} equipped={w.pet?.equipped} size={170} />
          </RoomScene>
        </View>
        <Body style={{ color: colors.muted, textAlign: 'center', marginVertical: 8, fontSize: 12 }}>
          {last ? `Last changed by ${last.by === w.uid ? 'you' : last.byName} · ${dayLabel(last.atMs)} ${timeLabel(last.atMs)}` : 'Decorate together. You both see changes instantly.'}
        </Body>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {CATS.map(c => <Chip key={c} label={LABEL[c]} active={cat === c} onPress={() => setCat(c)} />)}
        </ScrollView>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {itemsIn(cat).map(it => {
            const open = unlocked.has(keyOf(it.category, it.id));
            const active = multi ? placed.has(keyOf(it.category, it.id)) : bed[cat] === it.id;
            return (
              <Pressable key={it.id} onPress={() => (open ? pick(it.id) : w.toast(`🔒 Unlocks at ${it.unlockAt} affection`))}
                style={{ width: '31%', backgroundColor: colors.white, borderRadius: radius.md, padding: 10, alignItems: 'center', marginBottom: 10, borderWidth: active ? 2 : 0, borderColor: colors.purple, opacity: open ? 1 : 0.5 }}>
                {it.color ? <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: it.color, borderWidth: 1, borderColor: colors.lavender }} />
                  : <Text style={{ fontSize: 28 }}>{open ? (it.emoji ?? '·') : '🔒'}</Text>}
                <Text numberOfLines={1} style={{ fontSize: 11, color: colors.text, marginTop: 4, fontWeight: '600' }}>{it.name}</Text>
                <Text style={{ fontSize: 10, color: colors.muted }}>{open ? (active ? (multi ? 'Placed ✓' : 'Using ✓') : 'Tap') : `${it.unlockAt} pts`}</Text>
              </Pressable>
            );
          })}
        </View>
        {multi && <Body style={{ color: colors.muted, fontSize: 12 }}>Tap to place or remove (max 14 items in the room).</Body>}
      </ScrollView>
    </Screen>
  );
}

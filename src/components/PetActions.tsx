import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useWorld } from '../context/World';
import { FOODS } from '../data/catalog';
import * as petApi from '../services/pet';
import { Button } from './ui';
import { colors, radius } from '../theme';

export function usePetActions() {
  const w = useWorld();
  const [foodOpen, setFoodOpen] = useState(false);
  const after = (r: { awarded?: number } | null) => { if (r && r.awarded) w.toast(`+${r.awarded} affection 💗`); };
  return {
    foodOpen, openFood: () => setFoodOpen(true), closeFood: () => setFoodOpen(false),
    feed: async (id: string) => { setFoodOpen(false); after(await w.run(() => petApi.feed(id))); },
    pet: async () => after(await w.run(() => petApi.pet())),
    play: async () => after(await w.run(() => petApi.play())),
    toggleSleep: async () => after(await w.run(() => (w.pet?.sleeping ? petApi.wake() : petApi.sleep()))),
  };
}

export function FoodModal({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const { inventory } = useWorld();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(74,59,92,0.4)', justifyContent: 'flex-end' }}>
        <Pressable style={{ backgroundColor: colors.cream, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 12 }}>What's for snack? 🍽️</Text>
          {Object.entries(FOODS).map(([id, f]) => {
            const count = f.basic ? null : inventory?.foods?.[id] ?? 0;
            const out = count !== null && count < 1;
            return (
              <Pressable key={id} disabled={out} onPress={() => onPick(id)}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, padding: 12, marginBottom: 8, opacity: out ? 0.45 : 1 }}>
                <Text style={{ fontSize: 30 }}>{f.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{f.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>Tummy +{f.fullness} · Joy +{f.happiness}</Text>
                </View>
                <Text style={{ color: colors.purpleDark, fontWeight: '700' }}>{count === null ? '∞' : `×${count}`}</Text>
              </Pressable>
            );
          })}
          <Button title="Close" variant="soft" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function QuickActions() {
  const w = useWorld();
  const a = usePetActions();
  const sleeping = !!w.pet?.sleeping;
  const items: { label: string; onPress: () => void; off?: boolean }[] = [
    { label: '🥕 Feed', onPress: a.openFood, off: sleeping },
    { label: '🤍 Pet', onPress: a.pet, off: sleeping },
    { label: '🎾 Play', onPress: a.play, off: sleeping },
    { label: sleeping ? '☀️ Wake' : '🌙 Sleep', onPress: a.toggleSleep },
  ];
  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {items.map(i => (
          <Button key={i.label} small variant="glass" title={i.label} onPress={i.onPress} disabled={i.off || w.busy} style={{ flex: 1, marginHorizontal: 3, paddingHorizontal: 4 }} />
        ))}
      </View>
      <FoodModal visible={a.foodOpen} onClose={a.closeFood} onPick={a.feed} />
    </>
  );
}

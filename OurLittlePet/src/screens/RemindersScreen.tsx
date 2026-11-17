import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Body, Button, Card, Chip, H1, Screen } from '../components/ui';
import { FloatingHearts } from '../components/Hearts';
import { REMINDER_CATEGORIES } from '../config/content';
import { colors } from '../theme';

export default function RemindersScreen() {
  const nav = useNavigation();
  const [cat, setCat] = useState(REMINDER_CATEGORIES[0].id);
  const [idx, setIdx] = useState(0);
  const c = REMINDER_CATEGORIES.find(x => x.id === cat) ?? REMINDER_CATEGORIES[0];
  const msg = c.messages[idx % c.messages.length];
  const another = () => {
    if (c.messages.length < 2) return;
    let n = idx; while (n === idx) n = Math.floor(Math.random() * c.messages.length);
    setIdx(n);
  };
  return (
    <Screen>
      <FloatingHearts count={8} />
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <H1>Little Reminders 💌</H1>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 14 }}>
          {REMINDER_CATEGORIES.map(r => <Chip key={r.id} label={`${r.emoji} ${r.label}`} active={cat === r.id} onPress={() => { setCat(r.id); setIdx(0); }} />)}
        </ScrollView>
        <Card style={{ minHeight: 180, alignItems: 'center', justifyContent: 'center', padding: 26 }}>
          <Text style={{ fontSize: 40 }}>{c.emoji}</Text>
          <Body style={{ textAlign: 'center', fontSize: 18, lineHeight: 27, marginTop: 10, color: colors.text }}>{msg}</Body>
        </Card>
        <View style={{ marginTop: 16 }}>
          <Button title="Another one ✨" onPress={another} />
          <Button title="Back" variant="glass" onPress={() => nav.goBack()} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </Screen>
  );
}

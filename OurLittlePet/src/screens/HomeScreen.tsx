import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, Body, Button, Card, H1, presenceLabel, Screen } from '../components/ui';
import { Cat } from '../components/Cat';
import { FloatingHearts, HeartBurst } from '../components/Hearts';
import { QuickActions } from '../components/PetActions';
import { useWorld } from '../context/World';
import { levelInfo } from '../utils/levels';
import { MOOD_LABEL } from '../utils/petMath';
import { describeAction, timeLabel } from '../utils/format';
import { LETTER_UNLOCK_POINTS } from '../config/app';
import { colors, radius } from '../theme';

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const w = useWorld();
  const lv = levelInfo(w.points);
  const petName = w.pet?.name ?? 'Mochi';
  const letterOpen = w.points >= LETTER_UNLOCK_POINTS;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }}>
        {!w.connected && <View style={{ backgroundColor: colors.warn, borderRadius: radius.pill, padding: 6, alignItems: 'center', marginBottom: 10 }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Offline: showing saved data</Text></View>}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <H1>Our Little World</H1>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ marginRight: 8 }}><Avatar uri={w.me.photoURL} name={w.me.displayName} size={40} status={w.presence.me} /></View>
            <Avatar uri={w.partner?.photoURL} name={w.partner?.displayName ?? '?'} size={40} status={w.presence.partner} />
          </View>
        </View>
        <Body style={{ color: colors.muted, marginTop: 2 }}>
          {w.partner ? `${w.partner.displayName.split(' ')[0]} is ${presenceLabel(w.presence.partner).toLowerCase()}` : ''}
        </Body>

        <Card style={{ marginTop: 14, alignItems: 'center', overflow: 'hidden', paddingVertical: 20 }}>
          <FloatingHearts count={6} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{petName}</Text>
          <Text style={{ color: colors.purpleDark, fontWeight: '600', marginBottom: 4 }}>{MOOD_LABEL[w.visual] ?? ''}</Text>
          <Cat state={w.visual} equipped={w.pet?.equipped} size={230} />
          <HeartBurst nonce={w.burst} />
        </Card>

        <View style={{ marginTop: 14 }}><QuickActions /></View>

        <Card style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '800', color: colors.text }}>Affection · Level {lv.level}</Text>
            <Text style={{ color: colors.muted }}>{w.points}{lv.next ? ` / ${lv.next}` : ''}</Text>
          </View>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: colors.lavender, marginTop: 8, overflow: 'hidden' }}>
            <View style={{ width: `${Math.max(3, lv.progress * 100)}%`, height: 12, backgroundColor: colors.pinkDeep, borderRadius: 6 }} />
          </View>
          <Body style={{ color: colors.muted, marginTop: 6, fontSize: 12 }}>Grown together: every feed, pet, play and game counts for both of you.</Body>
        </Card>

        <View style={{ flexDirection: 'row', marginTop: 14 }}>
          <Button small variant="soft" title="💌 Reminders" onPress={() => nav.navigate('Reminders')} style={{ flex: 1, marginRight: 6 }} />
          <Button small variant="soft" title={letterOpen ? '💗 Love letter' : '🔒 Secret letter'} onPress={() => nav.navigate('Letter')} style={{ flex: 1, marginHorizontal: 3 }} />
          <Button small variant="soft" title="🎮 Games" onPress={() => nav.navigate('Games')} style={{ flex: 1, marginLeft: 6 }} />
        </View>

        <Card style={{ marginTop: 14 }}>
          <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 8 }}>Recent activity</Text>
          {w.activities.length === 0 ? <Body style={{ color: colors.muted }}>Nothing yet. Say hi to {petName}! 🐱</Body> :
            w.activities.slice(0, 4).map(a => (
              <View key={a.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: colors.text, flex: 1 }}>{a.by === w.uid ? 'You' : a.byName} {describeAction(a, petName)}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginLeft: 8 }}>{timeLabel(a.atMs)}</Text>
              </View>
            ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

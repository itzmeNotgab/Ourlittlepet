import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { Body, Button, Card, H1, Screen } from '../components/ui';
import { FloatingHearts } from '../components/Hearts';
import { useWorld } from '../context/World';
import { LETTER_UNLOCK_POINTS } from '../config/app';
import { LOVE_LETTER } from '../config/content';
import { colors } from '../theme';

const EW = 260; const EH = 170;

function Envelope({ opened, onOpen }: { opened: boolean; onOpen: () => void }) {
  const p = useSharedValue(0);
  React.useEffect(() => { p.value = withTiming(opened ? 1 : 0, { duration: 700 }); }, [opened, p]);
  const flap = useAnimatedStyle(() => ({
    opacity: p.value > 0.5 ? 0.0 : 1,
    transform: [{ perspective: 700 }, { translateY: -EH * 0.3 }, { rotateX: `${p.value * 180}deg` }, { translateY: EH * 0.3 }],
  }));
  return (
    <Pressable onPress={onOpen} disabled={opened} style={{ width: EW, height: EH, alignSelf: 'center', marginVertical: 20 }}>
      <Svg width={EW} height={EH}>
        <Rect x={0} y={0} width={EW} height={EH} rx={14} fill="#FFC5DC" />
        <Path d={`M0 ${EH} L${EW / 2} ${EH * 0.45} L${EW} ${EH} Z`} fill="#FFB0CF" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, flap]}>
        <Svg width={EW} height={EH * 0.6}>
          <Path d={`M0 0 L${EW} 0 L${EW / 2} ${EH * 0.6} Z`} fill="#FF8FB8" />
        </Svg>
      </Animated.View>
      {!opened && <Text style={{ position: 'absolute', alignSelf: 'center', top: EH * 0.36, fontSize: 34 }}>💗</Text>}
    </Pressable>
  );
}

export default function LetterScreen() {
  const nav = useNavigation();
  const { points } = useWorld();
  const [opened, setOpened] = useState(false);
  const [round, setRound] = useState(0);
  const unlocked = points >= LETTER_UNLOCK_POINTS;

  if (!unlocked) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 64 }}>🔒</Text>
          <H1>A secret letter</H1>
          <Body style={{ textAlign: 'center', color: colors.muted, marginVertical: 12 }}>
            Keep growing your affection together to unlock it.{'\n'}{points} / {LETTER_UNLOCK_POINTS}
          </Body>
          <View style={{ height: 12, alignSelf: 'stretch', borderRadius: 6, backgroundColor: colors.lavender, overflow: 'hidden' }}>
            <View style={{ width: `${Math.max(3, Math.min(100, (points / LETTER_UNLOCK_POINTS) * 100))}%`, height: 12, backgroundColor: colors.pinkDeep }} />
          </View>
          <Button title="Back" variant="glass" onPress={() => nav.goBack()} style={{ marginTop: 28 }} />
        </View>
      </Screen>
    );
  }
  return (
    <Screen>
      <FloatingHearts key={round} count={opened ? 14 : 4} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <H1>Our Secret Letter 💌</H1>
        <Envelope key={round} opened={opened} onOpen={() => setOpened(true)} />
        {!opened && <Body style={{ textAlign: 'center', color: colors.muted }}>Tap the envelope</Body>}
        {opened && (
          <Animated.View entering={FadeInUp.delay(600).duration(800)}>
            <Card style={{ padding: 22 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.purpleDark, marginBottom: 12 }}>{LOVE_LETTER.title}</Text>
              {LOVE_LETTER.paragraphs.map((t, i) => <Body key={i} style={{ marginBottom: 12, lineHeight: 24 }}>{t}</Body>)}
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.pinkDeep, textAlign: 'right' }}>{LOVE_LETTER.signoff}</Text>
            </Card>
            <Button title="Replay ✨" variant="soft" onPress={() => { setOpened(false); setRound(r => r + 1); }} style={{ marginTop: 14 }} />
          </Animated.View>
        )}
        <Button title="Back" variant="glass" onPress={() => nav.goBack()} style={{ marginTop: 10 }} />
      </ScrollView>
    </Screen>
  );
}

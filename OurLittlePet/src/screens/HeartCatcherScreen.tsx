import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Body, Button, Card, H1, Screen } from '../components/ui';
import { useWorld } from '../context/World';
import { claimGameReward } from '../services/pet';
import { FallingHeart, GAME_MS, spawnHeart, stepHearts } from '../games/heartLogic';
import { colors } from '../theme';

const BASKET_W = 90;
const BASKET_H = 40;

export default function HeartCatcherScreen() {
  const nav = useNavigation();
  const w = useWorld();
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [hearts, setHearts] = useState<FallingHeart[]>([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(GAME_MS);
  const [result, setResult] = useState('');
  const area = useRef({ w: 360, h: 500 });
  const bx = useSharedValue(180);
  const scoreRef = useRef(0);
  const startRef = useRef(0);

  const pan = Gesture.Pan().onUpdate(e => { bx.value = Math.max(BASKET_W / 2, Math.min(area.current.w - BASKET_W / 2, e.absoluteX)); });
  const basketStyle = useAnimatedStyle(() => ({ transform: [{ translateX: bx.value - BASKET_W / 2 }] }));

  const finish = useCallback(async (finalScore: number, elapsed: number) => {
    setPhase('over');
    const r = await w.run(() => claimGameReward({ game: 'heart', score: finalScore, durationMs: elapsed }));
    if (!r) setResult('Could not record the reward (check your connection).');
    else if (r.capped) setResult('Daily reward limit reached. Still fun, though! 💗');
    else setResult(`+${r.awarded} affection 💗${r.food ? ` and a treat: ${r.food}!` : ''}`);
  }, [w]);

  useEffect(() => {
    if (phase !== 'play') return;
    let id = 1; let last = Date.now(); let sinceSpawn = 0;
    startRef.current = last;
    const t = setInterval(() => {
      const nowMs = Date.now(); const dt = Math.min(0.06, (nowMs - last) / 1000); last = nowMs; sinceSpawn += dt;
      const elapsed = nowMs - startRef.current;
      setLeft(Math.max(0, GAME_MS - elapsed));
      setHearts(prev => {
        let hs = prev;
        if (sinceSpawn > 0.55) { sinceSpawn = 0; hs = [...hs, spawnHeart(id++, area.current.w)]; }
        const res = stepHearts(hs, dt, bx.value, BASKET_W / 2, area.current.h - BASKET_H - 24, area.current.h);
        if (res.gained) { scoreRef.current += res.gained; setScore(scoreRef.current); }
        return res.hearts;
      });
      if (elapsed >= GAME_MS) { clearInterval(t); finish(scoreRef.current, elapsed); }
    }, 33);
    return () => clearInterval(t);
  }, [phase, bx, finish]);

  const start = () => { scoreRef.current = 0; setScore(0); setHearts([]); setLeft(GAME_MS); setResult(''); setPhase('play'); };
  const onLayout = (e: LayoutChangeEvent) => { area.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; bx.value = area.current.w / 2; };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
        <Text style={{ fontWeight: '800', fontSize: 18, color: colors.text }}>❤️ {score}</Text>
        <Text style={{ fontWeight: '800', fontSize: 18, color: colors.purpleDark }}>⏱ {Math.ceil(left / 1000)}s</Text>
      </View>
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1, backgroundColor: colors.pinkSoft, margin: 12, borderRadius: 24, overflow: 'hidden' }} onLayout={onLayout}>
          {hearts.map(h => (
            <Text key={h.id} style={{ position: 'absolute', left: h.x - 14, top: h.y, fontSize: h.gold ? 34 : 28 }}>{h.gold ? '💛' : '💗'}</Text>
          ))}
          <Animated.View style={[{ position: 'absolute', bottom: 24, width: BASKET_W, height: BASKET_H, borderRadius: 14, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' }, basketStyle]}>
            <Text style={{ fontSize: 22 }}>🧺</Text>
          </Animated.View>
          {phase !== 'play' && (
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
              <Card style={{ alignItems: 'center', alignSelf: 'stretch' }}>
                <H1>{phase === 'ready' ? 'Heart Catcher' : 'Time!'}</H1>
                {phase === 'ready' ? <Body style={{ textAlign: 'center', marginVertical: 10 }}>Drag the basket to catch falling hearts. Golden hearts are worth 3!</Body> : (
                  <>
                    <Text style={{ fontSize: 44, fontWeight: '800', color: colors.pinkDeep }}>{score}</Text>
                    <Body style={{ textAlign: 'center', marginVertical: 6 }}>{result || 'Saving…'}</Body>
                  </>
                )}
                <Button title={phase === 'ready' ? 'Start' : 'Play again'} onPress={start} style={{ alignSelf: 'stretch', marginTop: 8 }} />
                <Button title="Back" variant="soft" onPress={() => nav.goBack()} style={{ alignSelf: 'stretch', marginTop: 8 }} />
              </Card>
            </View>
          )}
        </View>
      </GestureDetector>
    </Screen>
  );
}

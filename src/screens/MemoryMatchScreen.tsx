import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Body, Button, Card, H1, Screen } from '../components/ui';
import { useWorld } from '../context/World';
import { claimGameReward } from '../services/pet';
import { buildDeck, isMatch } from '../games/memoryLogic';
import { colors, radius } from '../theme';

function Tile({ face, shown, matched, onPress }: { face: string; shown: boolean; matched: boolean; onPress: () => void }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(shown || matched ? 1 : 0, { duration: 260 }); }, [shown, matched, p]);
  const back = useAnimatedStyle(() => ({ transform: [{ perspective: 600 }, { rotateY: `${p.value * 180}deg` }] }));
  const front = useAnimatedStyle(() => ({ transform: [{ perspective: 600 }, { rotateY: `${p.value * 180 - 180}deg` }] }));
  const face_ = { position: 'absolute' as const, width: '100%' as const, height: '100%' as const, borderRadius: radius.md, alignItems: 'center' as const, justifyContent: 'center' as const, backfaceVisibility: 'hidden' as const };
  return (
    <Pressable onPress={onPress} style={{ width: '23%', aspectRatio: 1, marginBottom: 10 }}>
      <Animated.View style={[face_, { backgroundColor: colors.lavenderDeep }, back]}><Text style={{ fontSize: 26, color: '#fff' }}>♥</Text></Animated.View>
      <Animated.View style={[face_, { backgroundColor: matched ? colors.pink : colors.white }, front]}><Text style={{ fontSize: 32 }}>{face}</Text></Animated.View>
    </Pressable>
  );
}

export default function MemoryMatchScreen() {
  const nav = useNavigation();
  const w = useWorld();
  const [deck, setDeck] = useState<string[]>(() => buildDeck());
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState('');
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());
  const lock = useRef(false);

  const reset = () => { setDeck(buildDeck()); setOpen([]); setMatched([]); setMoves(0); setResult(''); setDone(false); startedAt.current = Date.now(); lock.current = false; };

  const tap = (i: number) => {
    if (lock.current || open.includes(i) || matched.includes(i) || done) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      const m = moves + 1; setMoves(m); lock.current = true;
      if (isMatch(deck, next[0], next[1])) {
        const all = [...matched, ...next];
        setTimeout(() => { setMatched(all); setOpen([]); lock.current = false; if (all.length === deck.length) finish(m); }, 350);
      } else setTimeout(() => { setOpen([]); lock.current = false; }, 800);
    }
  };

  const finish = async (m: number) => {
    setDone(true);
    const r = await w.run(() => claimGameReward({ game: 'memory', moves: m, durationMs: Date.now() - startedAt.current }));
    if (!r) setResult('Could not record the reward (check your connection).');
    else if (r.capped) setResult('Daily reward limit reached. Still fun, though! 💗');
    else setResult(`+${r.awarded} affection 💗${r.food ? ` and a treat: ${r.food}!` : ''}`);
  };

  return (
    <Screen>
      <View style={{ padding: 16 }}>
        <H1>Memory Match 🃏</H1>
        <Body style={{ color: colors.muted }}>Moves: {moves} · Pairs: {matched.length / 2}/{deck.length / 2}</Body>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        {deck.map((f, i) => <Tile key={i} face={f} shown={open.includes(i)} matched={matched.includes(i)} onPress={() => tap(i)} />)}
      </View>
      {done && (
        <Card style={{ margin: 16, alignItems: 'center' }}>
          <H1>You did it! 💞</H1>
          <Body style={{ marginVertical: 8 }}>{moves} moves. {result || 'Saving…'}</Body>
          <Button title="Play again" onPress={reset} style={{ alignSelf: 'stretch' }} />
        </Card>
      )}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        {!done && <Button title="Restart" variant="soft" onPress={reset} />}
        <Button title="Back" variant="glass" onPress={() => nav.goBack()} style={{ marginTop: 8 }} />
      </View>
    </Screen>
  );
}

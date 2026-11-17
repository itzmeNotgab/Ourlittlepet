import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';

function Heart({ left, delay, size, dur, color }: { left: number; delay: number; size: number; dur: number; color: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: dur, easing: Easing.linear }), -1, false));
  }, [delay, dur, p]);
  const st = useAnimatedStyle(() => ({
    opacity: p.value < 0.1 ? p.value * 8 : (1 - p.value) * 0.8,
    transform: [{ translateY: -p.value * 280 }, { translateX: Math.sin(p.value * 6) * 14 }],
  }));
  return <Animated.Text style={[{ position: 'absolute', bottom: -10, left: `${left}%`, fontSize: size, color }, st]}>♥</Animated.Text>;
}

/** Ambient floating hearts (cheap: 8 animated texts). */
export function FloatingHearts({ count = 8 }: { count?: number }) {
  const palette = [colors.pinkDeep, colors.lavenderDeep, colors.pink];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Heart key={i} left={(i * 13 + 7) % 92} delay={i * 700} size={14 + ((i * 5) % 14)} dur={5200 + (i % 4) * 900} color={palette[i % 3]} />
      ))}
    </View>
  );
}

function Particle({ i }: { i: number }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }); }, [p]);
  const st = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [{ translateY: -p.value * (90 + i * 12) }, { translateX: (i - 3) * 14 * p.value }, { scale: 0.6 + p.value * 0.8 }],
  }));
  return <Animated.Text style={[{ position: 'absolute', fontSize: 22, color: colors.pinkDeep }, st]}>♥</Animated.Text>;
}

/** Burst of hearts; re-triggers whenever `nonce` changes (0 = hidden). */
export function HeartBurst({ nonce }: { nonce: number }) {
  if (!nonce) return null;
  return (
    <View key={nonce} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: '35%', alignItems: 'center' }}>
      {Array.from({ length: 7 }).map((_, i) => <Particle key={i} i={i} />)}
    </View>
  );
}

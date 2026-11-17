import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Ellipse, Circle, Path, Text as SvgText } from 'react-native-svg';
import type { Equipped, PetVisual } from '../types';
import { BackLayer, FrontLayer, TailLayer } from './Accessories';

export const NO_OUTFIT: Equipped = { head: null, back: null, cape: null, companion: null };
const OUT = '#EADFF7';

export function Cat({ state, equipped, size = 240 }: { state: PetVisual; equipped?: Equipped | null; size?: number }) {
  const y = useSharedValue(0);
  const s = useSharedValue(1);
  const r = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(y); cancelAnimation(s); cancelAnimation(r);
    y.value = 0; s.value = 1; r.value = 0;
    if (state === 'happy' || state === 'excited' || state === 'playing') {
      const d = state === 'playing' ? 220 : 340;
      y.value = withRepeat(withSequence(withTiming(-18, { duration: d, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: d })), -1);
    } else if (state === 'eating') {
      s.value = withRepeat(withSequence(withTiming(1.05, { duration: 180 }), withTiming(0.97, { duration: 180 })), -1);
    } else if (state === 'petted') {
      r.value = withRepeat(withSequence(withTiming(4, { duration: 150 }), withTiming(-4, { duration: 300 }), withTiming(0, { duration: 150 })), -1);
    } else if (state === 'sleeping') {
      s.value = withRepeat(withSequence(withTiming(1.03, { duration: 1800 }), withTiming(1, { duration: 1800 })), -1);
    } else {
      y.value = withRepeat(withSequence(withTiming(-5, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1);
    }
  }, [state, y, s, r]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scale: s.value }, { rotate: `${r.value}deg` }] }));
  const eq = equipped ?? NO_OUTFIT;
  const closed = state === 'sleeping';
  const joy = state === 'happy' || state === 'excited' || state === 'petted' || state === 'playing';

  return (
    <Animated.View style={[{ width: size, height: size * 1.1 }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 240">
        <BackLayer equipped={eq} />
        {/* default cat tail (behind body) */}
        <Path d="M144 212 Q196 208 184 156" stroke={OUT} strokeWidth={19} fill="none" strokeLinecap="round" />
        <Path d="M144 212 Q196 208 184 156" stroke="#fff" strokeWidth={14} fill="none" strokeLinecap="round" />
        <TailLayer equipped={eq} />
        {/* body */}
        <Ellipse cx={100} cy={180} rx={46} ry={48} fill="#fff" stroke={OUT} strokeWidth={2} />
        <Ellipse cx={80} cy={222} rx={15} ry={9} fill="#fff" stroke={OUT} strokeWidth={2} />
        <Ellipse cx={120} cy={222} rx={15} ry={9} fill="#fff" stroke={OUT} strokeWidth={2} />
        {/* triangle ears */}
        <Path d="M50 102 L54 46 L92 80 Z" fill="#fff" stroke={OUT} strokeWidth={2} strokeLinejoin="round" />
        <Path d="M150 102 L146 46 L108 80 Z" fill="#fff" stroke={OUT} strokeWidth={2} strokeLinejoin="round" />
        <Path d="M61 90 L62 62 L82 80 Z" fill="#FFC5DC" />
        <Path d="M139 90 L138 62 L118 80 Z" fill="#FFC5DC" />
        {/* head */}
        <Ellipse cx={100} cy={122} rx={55} ry={44} fill="#fff" stroke={OUT} strokeWidth={2} />
        <Path d="M92 82 L94 94 M100 80 L100 94 M108 82 L106 94" stroke="#E6DBFF" strokeWidth={4} strokeLinecap="round" />
        <Circle cx={68} cy={134} r={9} fill="#FFB6D0" opacity={joy ? 0.85 : 0.5} />
        <Circle cx={132} cy={134} r={9} fill="#FFB6D0" opacity={joy ? 0.85 : 0.5} />
        {/* eyes */}
        {closed ? (
          <>
            <Path d="M74 118 Q82 126 90 118" stroke="#4A3B5C" strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d="M110 118 Q118 126 126 118" stroke="#4A3B5C" strokeWidth={3} fill="none" strokeLinecap="round" />
          </>
        ) : joy ? (
          <>
            <Path d="M74 120 Q82 108 90 120" stroke="#4A3B5C" strokeWidth={3.5} fill="none" strokeLinecap="round" />
            <Path d="M110 120 Q118 108 126 120" stroke="#4A3B5C" strokeWidth={3.5} fill="none" strokeLinecap="round" />
          </>
        ) : state === 'sleepy' ? (
          <>
            <Path d="M75 117 L89 117" stroke="#4A3B5C" strokeWidth={3.5} strokeLinecap="round" />
            <Path d="M111 117 L125 117" stroke="#4A3B5C" strokeWidth={3.5} strokeLinecap="round" />
          </>
        ) : (
          <>
            <Ellipse cx={82} cy={117} rx={7} ry={8} fill="#8FD0B8" /><Ellipse cx={82} cy={117} rx={2.6} ry={6.5} fill="#4A3B5C" /><Circle cx={84.5} cy={113.5} r={2} fill="#fff" />
            <Ellipse cx={118} cy={117} rx={7} ry={8} fill="#8FD0B8" /><Ellipse cx={118} cy={117} rx={2.6} ry={6.5} fill="#4A3B5C" /><Circle cx={120.5} cy={113.5} r={2} fill="#fff" />
          </>
        )}
        {/* nose, mouth, whiskers */}
        <Path d="M96 128 L104 128 L100 133 Z" fill="#FF8FB8" />
        {state === 'eating' ? (
          <Ellipse cx={100} cy={142} rx={6} ry={5} fill="#E5707E" />
        ) : state === 'hungry' ? (
          <Path d="M93 142 Q100 137 107 142" stroke="#4A3B5C" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        ) : (
          <Path d="M100 133 Q95 142 89 137 M100 133 Q105 142 111 137" stroke="#4A3B5C" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        )}
        <Path d="M64 130 L36 124 M64 137 L36 140 M136 130 L164 124 M136 137 L164 140" stroke="#C9B6F2" strokeWidth={2} strokeLinecap="round" />
        {closed && (<><SvgText x={150} y={70} fontSize={22} fill="#9B7BE8" fontWeight="bold">Z</SvgText><SvgText x={165} y={50} fontSize={15} fill="#C9B6F2" fontWeight="bold">z</SvgText></>)}
        <FrontLayer equipped={eq} />
      </Svg>
    </Animated.View>
  );
}

export const CatBox = ({ children }: { children: React.ReactNode }) => <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>;

import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Avatar, Button, H1, Screen } from '../components/ui';
import { Cat } from '../components/Cat';
import { FloatingHearts } from '../components/Hearts';
import { useWorld } from '../context/World';
import { colors } from '../theme';

export default function PairingSuccess({ onDone }: { onDone: () => void }) {
  const { me, partner, pet } = useWorld();
  useEffect(() => { const t = setTimeout(onDone, 6000); return () => clearTimeout(t); }, [onDone]);
  return (
    <Screen>
      <FloatingHearts count={12} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Animated.View entering={ZoomIn.delay(200).duration(600)}><Avatar uri={me.photoURL} name={me.displayName} size={78} /></Animated.View>
          <Animated.View entering={ZoomIn.delay(500).duration(700)} style={{ marginHorizontal: 6 }}>
            <Cat state="excited" equipped={pet?.equipped} size={170} />
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(800).duration(600)}><Avatar uri={partner?.photoURL} name={partner?.displayName ?? '?'} size={78} /></Animated.View>
        </View>
        <Animated.View entering={FadeIn.delay(1400).duration(900)} style={{ alignItems: 'center' }}>
          <H1>It's official 💞</H1>
          <Text style={{ fontSize: 17, color: colors.purpleDark, textAlign: 'center', marginTop: 8, marginBottom: 22 }}>Your little world has found its second home.</Text>
          <Button title="Enter our world" onPress={onDone} />
        </Animated.View>
      </View>
    </Screen>
  );
}

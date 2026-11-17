import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Body, Button, Card, H1, H2, Screen } from '../components/ui';
import { colors } from '../theme';

export default function GamesScreen() {
  const nav = useNavigation<any>();
  return (
    <Screen>
      <View style={{ padding: 18 }}>
        <H1>Little Games 🎮</H1>
        <Body style={{ color: colors.muted, marginBottom: 14 }}>Every game helps your shared affection grow. Rewards are capped daily so there's nothing to grind.</Body>
        <Card style={{ marginBottom: 14 }}><H2>❤️ Heart Catcher</H2><Body style={{ marginVertical: 6 }}>Catch falling hearts for 30 seconds.</Body><Button title="Play" onPress={() => nav.navigate('HeartCatcher')} /></Card>
        <Card><H2>🃏 Memory Match</H2><Body style={{ marginVertical: 6 }}>Match all 8 cute pairs in as few moves as you can.</Body><Button title="Play" onPress={() => nav.navigate('MemoryMatch')} /></Card>
        <Button title="Back" variant="glass" onPress={() => nav.goBack()} style={{ marginTop: 16 }} />
      </View>
    </Screen>
  );
}

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabIcon, TabName } from '../components/TabIcon';
import { useWorld } from '../context/World';
import type { Prefs } from '../types';
import HomeScreen from '../screens/HomeScreen';
import PetScreen from '../screens/PetScreen';
import MessagesScreen from '../screens/MessagesScreen';
import RoomScreen from '../screens/RoomScreen';
import MemoriesScreen from '../screens/MemoriesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import LetterScreen from '../screens/LetterScreen';
import GamesScreen from '../screens/GamesScreen';
import HeartCatcherScreen from '../screens/HeartCatcherScreen';
import MemoryMatchScreen from '../screens/MemoryMatchScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs({ prefs }: { prefs?: Prefs }) {
  const { unread } = useWorld();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.cream, borderTopColor: colors.lavender, height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color }) => <TabIcon name={route.name as TabName} color={color} />,
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Pet" component={PetScreen} options={{ title: 'Our Pet' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarBadge: unread > 0 ? unread : undefined }} />
      <Tab.Screen name="Room" component={RoomScreen} options={{ title: 'Our Room' }} />
      <Tab.Screen name="Memories" component={MemoriesScreen} />
      <Tab.Screen name="Settings">{() => <SettingsScreen prefs={prefs} />}</Tab.Screen>
    </Tab.Navigator>
  );
}

export default function MainNavigator({ prefs }: { prefs?: Prefs }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Tabs">{() => <Tabs prefs={prefs} />}</Stack.Screen>
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="Letter" component={LetterScreen} />
      <Stack.Screen name="Games" component={GamesScreen} />
      <Stack.Screen name="HeartCatcher" component={HeartCatcherScreen} />
      <Stack.Screen name="MemoryMatch" component={MemoryMatchScreen} />
    </Stack.Navigator>
  );
}

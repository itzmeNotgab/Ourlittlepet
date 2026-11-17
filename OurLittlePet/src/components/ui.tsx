import React, { ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, shadow } from '../theme';
import type { PresenceState } from '../types';

export function Screen({ children, style, edges }: { children: ReactNode; style?: StyleProp<ViewStyle>; edges?: ('top' | 'bottom' | 'left' | 'right')[] }) {
  return (
    <SafeAreaView edges={edges ?? ['top']} style={[styles.screen, style]}>
      <View pointerEvents="none" style={[styles.blob, { top: -60, right: -60, backgroundColor: colors.pink }]} />
      <View pointerEvents="none" style={[styles.blob, { bottom: 80, left: -90, backgroundColor: colors.lavender }]} />
      {children}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type Variant = 'primary' | 'soft' | 'glass' | 'danger';
export function Button({ title, onPress, variant = 'primary', disabled, loading, small, style }: {
  title: string; onPress: () => void; variant?: Variant; disabled?: boolean; loading?: boolean; small?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'primary' ? colors.pinkDeep : variant === 'soft' ? colors.lavender : variant === 'danger' ? colors.danger : colors.glass;
  const fg = variant === 'primary' || variant === 'danger' ? colors.white : colors.purpleDark;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn, small && styles.btnSmall, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        variant === 'glass' && styles.glass, style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.btnText, small && { fontSize: 13 }, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

const dot: Record<PresenceState, string> = { online: '#4CD98A', recent: '#FFC857', offline: '#BDB3C9' };
export function Avatar({ uri, name, size = 44, status }: { uri?: string | null; name: string; size?: number; status?: PresenceState }) {
  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.lavender }} />
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.lavenderDeep, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: size * 0.42 }}>{(name || '?').charAt(0).toUpperCase()}</Text>
        </View>
      )}
      {status ? <View style={[styles.dot, { backgroundColor: dot[status], width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14 }]} /> : null}
    </View>
  );
}
export const presenceLabel = (s: PresenceState) => (s === 'online' ? 'Online' : s === 'recent' ? 'Recently active' : 'Offline');

export function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statLabel}>{Math.round(value)}</Text>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(2, Math.min(100, value))}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

export const H1 = ({ children }: { children: ReactNode }) => <Text style={styles.h1}>{children}</Text>;
export const H2 = ({ children }: { children: ReactNode }) => <Text style={styles.h2}>{children}</Text>;
export const Body = ({ children, style }: { children: ReactNode; style?: any }) => <Text style={[styles.body, style]}>{children}</Text>;

export function Empty({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <View style={{ alignItems: 'center', padding: 32 }}>
      <Text style={{ fontSize: 54 }}>{emoji}</Text>
      <Text style={[styles.h2, { marginTop: 8, textAlign: 'center' }]}>{title}</Text>
      <Text style={[styles.body, { textAlign: 'center', marginTop: 4, color: colors.muted }]}>{text}</Text>
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && { backgroundColor: colors.purple }]}>
      <Text style={{ color: active ? colors.white : colors.purpleDark, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  blob: { position: 'absolute', width: 220, height: 220, borderRadius: 110, opacity: 0.5 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, ...shadow },
  btn: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { paddingVertical: 9, paddingHorizontal: 14 },
  btnText: { fontSize: font.body, fontWeight: '700' },
  glass: { borderWidth: 1, borderColor: colors.glassBorder, ...shadow },
  dot: { position: 'absolute', right: 0, bottom: 0, borderWidth: 2, borderColor: colors.white },
  statLabel: { fontSize: font.small, color: colors.muted, fontWeight: '600' },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.lavender, overflow: 'hidden', marginTop: 3 },
  fill: { height: 10, borderRadius: 5 },
  h1: { fontSize: font.h1, fontWeight: '800', color: colors.text },
  h2: { fontSize: font.h2, fontWeight: '700', color: colors.text },
  body: { fontSize: font.body, color: colors.text, lineHeight: 21 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.lavender, marginRight: 8 },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';
import { CATALOG, findItem } from '../data/catalog';
import type { BedroomDoc } from '../types';

/** Renders the shared bedroom. Children (the cat) are placed on the floor in the middle. */
export function RoomScene({ room, night, height = 300, children }: { room: BedroomDoc | null; night?: boolean; height?: number; children?: React.ReactNode }) {
  const r: BedroomDoc = room ?? { wallpaper: 'pink', floor: 'wood', bed: 'pinkBed', rug: 'roundPink', lighting: 'warm', window: 'day', theme: 'none', items: [] };
  const wall = findItem('wallpaper', r.wallpaper)?.color ?? '#FFD6E8';
  const floorItem = findItem('floor', r.floor);
  const bed = findItem('bed', r.bed)?.color ?? '#FFB6D0';
  const rug = findItem('rug', r.rug);
  const win = findItem('window', r.window)?.color ?? '#BFE3FF';
  const light = findItem('lighting', r.lighting);
  const theme = findItem('theme', r.theme);
  const placed = (r.items ?? []).map(k => { const [c, id] = k.split(':'); return findItem(c, id); }).filter(Boolean);
  const stars = r.window === 'nightW' || r.window === 'starryW';

  return (
    <View style={[styles.wrap, { height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice">
        <Rect x={0} y={0} width={300} height={180} fill={wall} />
        <Rect x={0} y={180} width={300} height={120} fill={floorItem?.color ?? '#E8C9A0'} />
        {r.floor === 'checker' && Array.from({ length: 30 }).map((_, i) => (
          <Rect key={i} x={(i % 10) * 30} y={180 + Math.floor(i / 10) * 40} width={30} height={40} fill={(i + Math.floor(i / 10)) % 2 ? '#F3C6DA' : '#fff'} />
        ))}
        <Rect x={0} y={176} width={300} height={8} fill="rgba(255,255,255,0.5)" />
        {/* window */}
        <Rect x={190} y={30} width={80} height={80} rx={10} fill="#fff" />
        <Rect x={196} y={36} width={68} height={68} rx={6} fill={win} />
        {stars && [[210, 52], [240, 48], [225, 80], [250, 90]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.2} fill="#FFF3B0" />)}
        <Rect x={228} y={36} width={4} height={68} fill="#fff" /><Rect x={196} y={68} width={68} height={4} fill="#fff" />
        {/* rug + bed */}
        {r.rug !== 'none' && <Ellipse cx={150} cy={250} rx={90} ry={26} fill={rug?.color ?? '#FFB3CF'} opacity={0.9} />}
        <Rect x={14} y={150} width={92} height={50} rx={12} fill={bed} />
        <Rect x={14} y={140} width={20} height={64} rx={8} fill={bed} opacity={0.85} />
        <Rect x={36} y={146} width={36} height={18} rx={9} fill="#fff" opacity={0.9} />
      </Svg>
      {theme?.emoji && Array.from({ length: 10 }).map((_, i) => (
        <Text key={i} style={{ position: 'absolute', left: `${(i * 29 + 6) % 88}%`, top: `${(i * 17 + 5) % 50}%`, fontSize: 14, opacity: 0.35 }}>{theme.emoji}</Text>
      ))}
      {r.lighting === 'fairy' && Array.from({ length: 9 }).map((_, i) => (
        <Text key={i} style={{ position: 'absolute', left: `${i * 11 + 3}%`, top: `${2 + (i % 2) * 3}%`, fontSize: 12 }}>✨</Text>
      ))}
      {placed.map(it => it && it.emoji ? (
        <Text key={it.category + it.id} style={{ position: 'absolute', left: `${it.x ?? 50}%`, top: `${it.y ?? 50}%`, fontSize: (it.size ?? 28) * (height / 300), transform: [{ translateX: -12 }, { translateY: -12 }] }}>{it.emoji}</Text>
      ) : null)}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: light?.color ?? 'transparent', opacity: light?.opacity ?? 0 }]} />
      {night && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#1B1640', opacity: 0.55 }]} />}
      <View style={styles.center} pointerEvents="box-none">{children}</View>
    </View>
  );
}
export const ROOM_ITEM_COUNT = CATALOG.length;

const styles = StyleSheet.create({
  wrap: { borderRadius: 28, overflow: 'hidden', backgroundColor: '#FFD6E8' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'flex-end' },
});

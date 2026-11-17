import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type TabName = 'Home' | 'Pet' | 'Messages' | 'Room' | 'Memories' | 'Settings';

/** Small original line icons (no icon library). */
export function TabIcon({ name, color, size = 24 }: { name: TabName; color: string; size?: number }) {
  const p = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'Home' && (<><Path d="M3 11 L12 3 L21 11" {...p} /><Path d="M5 10 V20 H19 V10" {...p} /><Path d="M10 20 V14 H14 V20" {...p} /></>)}
      {name === 'Pet' && (<><Path d="M8 10 C6 4 8 2 9.5 4 C10.5 6 10.5 8 10 10" {...p} /><Path d="M16 10 C18 4 16 2 14.5 4 C13.5 6 13.5 8 14 10" {...p} /><Circle cx={12} cy={15} r={6} {...p} /></>)}
      {name === 'Messages' && (<><Path d="M4 5 H20 V16 H11 L6 20 V16 H4 Z" {...p} /><Path d="M8 10 H16" {...p} /></>)}
      {name === 'Room' && (<><Rect x={3} y={11} width={18} height={7} rx={2} {...p} /><Path d="M3 18 V20 M21 18 V20 M5 11 V7 H11 V11" {...p} /></>)}
      {name === 'Memories' && (<><Rect x={4} y={4} width={16} height={17} rx={2} {...p} /><Rect x={7} y={7} width={10} height={8} {...p} /><Path d="M8 18 H14" {...p} /></>)}
      {name === 'Settings' && (<><Circle cx={12} cy={12} r={3} {...p} /><Path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21 M5.6 5.6 L7.8 7.8 M16.2 16.2 L18.4 18.4 M5.6 18.4 L7.8 16.2 M16.2 7.8 L18.4 5.6" {...p} /></>)}
    </Svg>
  );
}

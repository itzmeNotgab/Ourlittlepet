import React from 'react';
import { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { Equipped } from '../types';

/** Behind-the-body layers: back items + cape. */
export function BackLayer({ equipped }: { equipped: Equipped }) {
  return (
    <G>
      {equipped.back === 'angelWings' && (
        <G>
          <Path d="M62 150 Q8 105 18 192 Q48 182 64 172 Z" fill="#fff" stroke="#C9B6F2" strokeWidth={3} />
          <Path d="M138 150 Q192 105 182 192 Q152 182 136 172 Z" fill="#fff" stroke="#C9B6F2" strokeWidth={3} />
        </G>
      )}
      {equipped.back === 'butterflyWings' && (
        <G>
          <Ellipse cx={44} cy={150} rx={34} ry={22} fill="#C9B6F2" rotation={-25} origin="44,150" opacity={0.9} />
          <Ellipse cx={156} cy={150} rx={34} ry={22} fill="#FFB6D0" rotation={25} origin="156,150" opacity={0.9} />
          <Ellipse cx={50} cy={185} rx={24} ry={16} fill="#FFB6D0" rotation={20} origin="50,185" opacity={0.9} />
          <Ellipse cx={150} cy={185} rx={24} ry={16} fill="#C9B6F2" rotation={-20} origin="150,185" opacity={0.9} />
        </G>
      )}
      {equipped.cape && (
        <G>
          <Path d="M62 150 Q100 140 138 150 L152 228 Q100 242 48 228 Z"
            fill={equipped.cape === 'pinkCape' ? '#FF8FB8' : equipped.cape === 'starCape' ? '#7C66C9' : '#B03A5B'}
            stroke={equipped.cape === 'royalCape' ? '#FFD66B' : 'none'} strokeWidth={4} />
          {equipped.cape === 'starCape' && (<G><SvgText x={70} y={200} fontSize={14} fill="#FFE08A">✦</SvgText><SvgText x={118} y={215} fontSize={12} fill="#FFE08A">✦</SvgText><SvgText x={96} y={180} fontSize={10} fill="#FFE08A">✦</SvgText></G>)}
        </G>
      )}
    </G>
  );
}

export function TailLayer({ equipped }: { equipped: Equipped }) {
  return equipped.back === 'catTail' ? <Circle cx={150} cy={205} r={18} fill="#fff" stroke="#E6DBFF" strokeWidth={3} /> : null;
}

/** On-top layers: head items + companion. */
export function FrontLayer({ equipped }: { equipped: Equipped }) {
  const h = equipped.head;
  return (
    <G>
      {h === 'bow' && (<G><Path d="M100 82 L76 68 L76 96 Z" fill="#FF8FB8" /><Path d="M100 82 L124 68 L124 96 Z" fill="#FF8FB8" /><Circle cx={100} cy={82} r={7} fill="#FF5E97" /></G>)}
      {h === 'ribbon' && (<G><Path d="M58 96 Q100 70 142 96" stroke="#C9B6F2" strokeWidth={9} fill="none" strokeLinecap="round" /><Circle cx={128} cy={84} r={8} fill="#9B7BE8" /></G>)}
      {h === 'halo' && <Ellipse cx={100} cy={72} rx={32} ry={8} stroke="#FFD66B" strokeWidth={5} fill="none" />}
      {h === 'flowers' && (
        <G>
          {[[66, 92, '#FF8FB8'], [80, 82, '#FFD66B'], [100, 78, '#C9B6F2'], [120, 82, '#FFD66B'], [134, 92, '#FF8FB8']].map(([x, y, c], i) => (
            <Circle key={i} cx={x as number} cy={y as number} r={8} fill={c as string} stroke="#fff" strokeWidth={2} />
          ))}
        </G>
      )}
      {h === 'topHat' && (<G><Rect x={78} y={56} width={44} height={32} rx={4} fill="#4A3B5C" /><Rect x={68} y={86} width={64} height={8} rx={4} fill="#4A3B5C" /><Rect x={78} y={76} width={44} height={6} fill="#FF8FB8" /></G>)}
      {h === 'heartBand' && (<G><Path d="M58 96 Q100 72 142 96" stroke="#FF8FB8" strokeWidth={6} fill="none" /><SvgText x={90} y={86} fontSize={24} fill="#FF5E97">♥</SvgText></G>)}
      {equipped.companion === 'butterfly' && <SvgText x={150} y={150} fontSize={30}>🦋</SvgText>}
      {equipped.companion === 'chick' && <SvgText x={146} y={228} fontSize={30}>🐤</SvgText>}
      {equipped.companion === 'heartBalloon' && <SvgText x={152} y={120} fontSize={34}>🎈</SvgText>}
    </G>
  );
}

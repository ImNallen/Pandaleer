import { Circle, Ellipse, Path, Rect, Svg } from 'react-native-svg';

import { useArt } from '@/ui/tokens';

export type CampState = 'reached' | 'next' | 'ahead';

const TENT: Record<CampState, { canvas: 'orange' | 'khaki' | 'mist'; flap: 'rustDeep' | 'khakiDeep' | 'mistDeep'; flag: boolean }> = {
  reached: { canvas: 'orange', flap: 'rustDeep', flag: true },
  next: { canvas: 'khaki', flap: 'khakiDeep', flag: false },
  ahead: { canvas: 'mist', flap: 'mistDeep', flag: false },
};

export function CampTent({ state, size }: { state: CampState; size: number }) {
  const palette = useArt();
  const tent = TENT[state];
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessible={false}>
      <Ellipse cx={24} cy={42} rx={18} ry={4} fill={palette.brown} opacity={0.18} />
      <Path d="M 24 8 Q 26 8 27 10 L 42 38 Q 44 42 40 42 L 8 42 Q 4 42 6 38 L 21 10 Q 22 8 24 8 Z" fill={palette[tent.canvas]} />
      <Path d="M 24 16 L 33 42 L 15 42 Z" fill={palette[tent.flap]} />
      {tent.flag && (
        <>
          <Rect x={23} y={1} width={2} height={9} rx={1} fill={palette.leatherDeep} />
          <Path d="M 25 1.5 L 33 4 L 25 6.5 Z" fill={palette.fire} />
        </>
      )}
      {state === 'next' && <Circle cx={24} cy={30} r={3} fill={palette.fire} />}
    </Svg>
  );
}

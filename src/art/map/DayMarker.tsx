import { Ellipse, Path, Svg } from 'react-native-svg';

import { Campfire } from '@/art/Campfire';
import { useArt } from '@/ui/tokens';

export type DayState = 'met' | 'walked' | 'rest';

const GOAL_FIRE = { kind: 'burning', days: 3, litToday: true } as const;

/** Where the panda camped that night: a campfire when the goal was met, a tent otherwise. */
export function DayMarker({ state, size }: { state: DayState; size: number }) {
  const palette = useArt();
  if (state === 'met') return <Campfire fire={GOAL_FIRE} size={size} />;
  const rest = state === 'rest';
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessible={false}>
      <Ellipse cx={24} cy={42} rx={18} ry={4} fill={palette.brown} opacity={0.18} />
      <Path
        d="M 24 8 Q 26 8 27 10 L 42 38 Q 44 42 40 42 L 8 42 Q 4 42 6 38 L 21 10 Q 22 8 24 8 Z"
        fill={rest ? palette.mist : palette.khaki}
        transform={rest ? 'translate(24 42) scale(0.8) translate(-24 -42)' : undefined}
      />
      <Path
        d="M 24 16 L 33 42 L 15 42 Z"
        fill={rest ? palette.mistDeep : palette.khakiDeep}
        transform={rest ? 'translate(24 42) scale(0.8) translate(-24 -42)' : undefined}
      />
    </Svg>
  );
}

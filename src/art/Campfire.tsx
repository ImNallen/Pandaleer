import { Circle, Ellipse, G, Path, Rect, Svg } from 'react-native-svg';
import { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

import type { Campfire as CampfireState } from '@/game/game';
import { useArt } from '@/ui/tokens';

import { AnimatedG, translate, useArtClock, wave, type Matrix } from './motion';

type Props = { fire: CampfireState; size: number; animated?: boolean };

/** The fire grows with the streak; checked top to bottom. */
const TIERS = [
  { minDays: 14, scale: 1.08, sparks: 4 },
  { minDays: 7, scale: 0.96, sparks: 2 },
  { minDays: 3, scale: 0.82, sparks: 0 },
  { minDays: 1, scale: 0.66, sparks: 0 },
] as const;

const BASE_Y = 94;

export function Campfire({ fire, size, animated = false }: Props) {
  const time = useArtClock(animated);
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityRole="image" accessibilityLabel={describe(fire)}>
      <Ground />
      {fire.kind === 'embers' && <Smoke time={time} />}
      <Logs glowing={fire.kind !== 'unlit'} />
      {fire.kind === 'burning' && <Flames tier={TIERS.find((tier) => fire.days >= tier.minDays)!} time={time} />}
      {fire.kind === 'embers' && <Embers time={time} />}
    </Svg>
  );
}

function describe(fire: CampfireState): string {
  switch (fire.kind) {
    case 'unlit':
      return 'Campfire, not lit yet';
    case 'burning':
      return `Campfire burning, ${fire.days}-day streak`;
    case 'embers':
      return `Campfire embers, the ${fire.lastStreak}-day streak went out`;
  }
}

function Ground() {
  const palette = useArt();
  const stones = [
    { x: 26, y: 102, r: 8 },
    { x: 41, y: 107, r: 8.5 },
    { x: 60, y: 109, r: 9 },
    { x: 79, y: 107, r: 8.5 },
    { x: 94, y: 102, r: 8 },
  ];
  return (
    <G>
      <Ellipse cx={60} cy={104} rx={44} ry={9} fill={palette.brown} opacity={0.12} />
      {stones.map((stone) => (
        <Ellipse key={stone.x} cx={stone.x} cy={stone.y} rx={stone.r} ry={stone.r * 0.68} fill={palette.mist} />
      ))}
    </G>
  );
}

function Logs({ glowing }: { glowing: boolean }) {
  const palette = useArt();
  return (
    <G>
      {[-16, 16].map((angle) => (
        <G key={angle} transform={`rotate(${angle} 60 ${BASE_Y + 2})`}>
          <Rect x={30} y={BASE_Y - 4} width={60} height={12} rx={6} fill={palette.leather} />
          <Ellipse cx={angle < 0 ? 35 : 85} cy={BASE_Y + 2} rx={4} ry={5} fill={glowing ? palette.fireDeep : palette.khaki} />
        </G>
      ))}
    </G>
  );
}

function flicker(t: number, phase: number, base: number): Matrix {
  'worklet';
  const sy = base * (1 + 0.06 * wave(t, 0.9, phase));
  const sx = base * (1 - 0.03 * wave(t, 0.9, phase));
  const skew = 0.06 * wave(t, 1.7, phase);
  return [sx, 0, skew * sy, sy, 60 * (1 - sx) - skew * sy * BASE_Y, BASE_Y * (1 - sy)];
}

function Flames({ tier, time }: { tier: (typeof TIERS)[number]; time: SharedValue<number> }) {
  const palette = useArt();
  const outer = useAnimatedProps(() => ({ matrix: flicker(time.value, 0, tier.scale) }));
  const inner = useAnimatedProps(() => ({ matrix: flicker(time.value, 1.9, tier.scale) }));
  return (
    <G>
      <AnimatedG animatedProps={outer as object}>
        <Path
          d="M 60 18 C 68 34 88 46 86 68 C 85 86 74 96 60 96 C 46 96 35 86 34 68 C 33 54 42 46 47 36 C 50 46 54 50 56 46 C 58 38 55 30 60 18 Z"
          fill={palette.orange}
        />
      </AnimatedG>
      <AnimatedG animatedProps={inner as object}>
        <Path
          d="M 60 44 C 67 54 76 62 75 75 C 74 87 68 93 60 93 C 52 93 46 87 45 76 C 44 67 50 61 54 54 C 55 60 58 62 59 58 C 60 54 58 50 60 44 Z"
          fill={palette.fire}
        />
        <Ellipse cx={60} cy={83} rx={8} ry={9} fill={palette.cream} />
      </AnimatedG>
      {Array.from({ length: tier.sparks }, (_, i) => (
        <Spark key={i} index={i} time={time} />
      ))}
    </G>
  );
}

function Spark({ index, time }: { index: number; time: SharedValue<number> }) {
  const palette = useArt();
  const x = 46 + index * 9;
  const props = useAnimatedProps(() => {
    if (time.value === 0) return { matrix: translate(0, -6 * (index % 2)), opacity: 1 };
    const phase = (time.value / 1.6 + index * 0.27) % 1;
    return { matrix: translate(Math.sin(phase * 6 + index) * 4, -phase * 22), opacity: 1 - phase };
  });
  return (
    <AnimatedG animatedProps={props as object}>
      <Circle cx={x} cy={22} r={2} fill={palette.fire} />
    </AnimatedG>
  );
}

function Embers({ time }: { time: SharedValue<number> }) {
  const palette = useArt();
  const glow = useAnimatedProps(() => ({ opacity: time.value === 0 ? 1 : 0.7 + 0.3 * wave(time.value, 2.2) }));
  return (
    <AnimatedG animatedProps={glow}>
      <Ellipse cx={50} cy={BASE_Y - 2} rx={6} ry={3.5} fill={palette.rust} />
      <Ellipse cx={66} cy={BASE_Y - 3} rx={7} ry={4} fill={palette.fireDeep} />
      <Ellipse cx={58} cy={BASE_Y + 3} rx={5} ry={3} fill={palette.orange} />
    </AnimatedG>
  );
}

function Smoke({ time }: { time: SharedValue<number> }) {
  return (
    <G>
      {[0, 1].map((i) => (
        <Wisp key={i} index={i} time={time} />
      ))}
    </G>
  );
}

function Wisp({ index, time }: { index: number; time: SharedValue<number> }) {
  const palette = useArt();
  const x = 54 + index * 10;
  const props = useAnimatedProps(() => {
    if (time.value === 0) return { matrix: translate(0, -index * 8), opacity: 0.8 };
    const phase = (time.value / 3.2 + index * 0.5) % 1;
    return { matrix: translate(phase * 6, -phase * 26), opacity: Math.sin(phase * Math.PI) * 0.85 };
  });
  return (
    <AnimatedG animatedProps={props as object}>
      <Path
        d={`M ${x} 84 C ${x - 6} 76 ${x + 6} 70 ${x} 62 C ${x - 5} 56 ${x + 4} 50 ${x} 46`}
        stroke={palette.mist}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
    </AnimatedG>
  );
}

import { Circle, Ellipse, G, Path, Rect, Svg } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

import { useArt, type ArtPalette } from '@/ui/tokens';

import { AnimatedG, liftAndSquash, rotateAbout, translate, useArtClock, wave, type Matrix } from '../motion';
import { Head, type Expression } from './Head';

export type PandaPose = 'standing' | 'sleeping' | 'packing' | 'walking' | 'flag' | 'celebrating';
export type { Expression };

type Props = {
  pose: PandaPose;
  expression?: Expression;
  size: number;
  animated?: boolean;
};

type Motion = 'still' | 'breathe' | 'walk' | 'hop';
type Prop = 'none' | 'map' | 'stick' | 'flag' | 'sparkles';

type StandingSpec = {
  /** Arm angles in degrees outward from hanging straight down; 'swing' animates while walking. */
  arms: readonly [left: number | 'swing', right: number];
  prop: Prop;
  motion: Motion;
  x: number;
};

type PoseSpec = { label: string; expression: Expression } & ({ scene: 'tent' } | { scene: 'standing'; spec: StandingSpec });

const POSES: Record<PandaPose, PoseSpec> = {
  standing: {
    label: 'standing ready to walk',
    expression: 'content',
    scene: 'standing',
    spec: { arms: [14, 14], prop: 'none', motion: 'still', x: 120 },
  },
  sleeping: { label: 'asleep in a tent', expression: 'sleepy', scene: 'tent' },
  packing: {
    label: 'packing up and reading the map',
    expression: 'content',
    scene: 'standing',
    spec: { arms: [-12, -12], prop: 'map', motion: 'breathe', x: 120 },
  },
  walking: {
    label: 'walking the trail',
    expression: 'content',
    scene: 'standing',
    spec: { arms: ['swing', -4], prop: 'stick', motion: 'walk', x: 116 },
  },
  flag: {
    label: 'planting a flag',
    expression: 'excited',
    scene: 'standing',
    spec: { arms: [16, 96], prop: 'flag', motion: 'breathe', x: 104 },
  },
  celebrating: {
    label: 'jumping for joy',
    expression: 'excited',
    scene: 'standing',
    spec: { arms: [122, 122], prop: 'sparkles', motion: 'hop', x: 120 },
  },
};

const GROUND = 208;
const BODY_Y = 168;

export function Panda({ pose, expression, size, animated = false }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240" accessibilityRole="image" accessibilityLabel={`Red panda explorer ${POSES[pose].label}`}>
      <PandaArt pose={pose} expression={expression} animated={animated} />
    </Svg>
  );
}

/** The panda without its own <Svg>, for drawing inside another 240 × 240 canvas. */
export function PandaArt({ pose, expression, animated = false }: Omit<Props, 'size'>) {
  const time = useArtClock(animated);
  const spec = POSES[pose];
  const face = expression ?? spec.expression;
  return spec.scene === 'tent' ? <TentScene time={time} /> : <StandingScene spec={spec.spec} expression={face} time={time} />;
}

function StandingScene({ spec, expression, time }: { spec: StandingSpec; expression: Expression; time: SharedValue<number> }) {
  const palette = useArt();
  const { motion, x } = spec;
  const character = useAnimatedProps(() => ({ matrix: characterMatrix(motion, time.value) }));
  const shadow = useAnimatedProps(() => {
    const lift = -characterMatrix(motion, time.value)[5];
    return { rx: 40 - Math.max(0, lift) * 0.8, opacity: 0.16 - Math.max(0, lift) * 0.004 };
  });

  return (
    <G>
      <AnimatedEllipse cx={x} cy={GROUND + 2} rx={40} ry={6} fill={palette.brown} opacity={0.16} animatedProps={shadow} />
      {spec.prop === 'flag' && <FlagPole x={x + 52} />}
      {spec.prop === 'sparkles' && <Sparkles time={time} />}
      <AnimatedG animatedProps={character as object}>
        <G transform={`translate(${x} ${BODY_Y})`}>
          <Tail time={time} motion={motion} />
          <Legs time={time} walking={motion === 'walk'} />
          <Ellipse cx={0} cy={0} rx={30} ry={29} fill={palette.rust} />
          <Path d="M -18 20 Q 0 30 18 20 Q 12 28 0 29 Q -12 28 -18 20 Z" fill={palette.rustDeep} />
          <Satchel />
          {spec.prop === 'stick' && <WalkingStick />}
          <Arm side={-1} angle={spec.arms[0]} time={time} />
          <Arm side={1} angle={spec.arms[1]} time={time} />
          {spec.prop === 'map' && <OpenMap />}
          <G transform="translate(0 -72)">
            <Head expression={expression} time={time} />
          </G>
        </G>
      </AnimatedG>
    </G>
  );
}

function characterMatrix(motion: Motion, t: number): Matrix {
  'worklet';
  if (motion === 'walk') {
    const bounce = Math.abs(wave(t, 1.1));
    return liftAndSquash(-bounce * 4, 1, GROUND);
  }
  if (motion === 'hop') {
    const phase = t % 1.3;
    const lift = t > 0 && phase < 0.55 ? Math.sin((phase / 0.55) * Math.PI) * 18 : 0;
    return liftAndSquash(-lift, 1, GROUND);
  }
  if (motion === 'still') return liftAndSquash(0, 1, GROUND);
  return liftAndSquash(0, 1 + 0.018 * wave(t, 3.4), GROUND);
}

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const TAIL_SWAY: Record<Motion, number> = { still: 0, breathe: 6, walk: 9, hop: 6 };

function Tail({ time, motion }: { time: SharedValue<number>; motion: Motion }) {
  const palette = useArt();
  const sway = useAnimatedProps(() => ({
    matrix: rotateAbout(TAIL_SWAY[motion] * wave(time.value, motion === 'walk' ? 1.1 : 2.6), -14, 18),
  }));
  const d = 'M -12 20 C -46 34 -72 14 -62 -20';
  return (
    <AnimatedG animatedProps={sway as object}>
      <Path d={d} stroke={palette.rust} strokeWidth={21} strokeLinecap="round" fill="none" />
      <Path d={d} stroke={palette.rustDeep} strokeWidth={21} strokeDasharray="8 9" strokeDashoffset={-4} fill="none" />
    </AnimatedG>
  );
}

function Legs({ time, walking }: { time: SharedValue<number>; walking: boolean }) {
  const palette = useArt();
  const left = useAnimatedProps(() => ({ y: 12 - (walking ? Math.max(0, wave(time.value, 1.1)) * 5 : 0) }));
  const right = useAnimatedProps(() => ({ y: 12 - (walking ? Math.max(0, -wave(time.value, 1.1)) * 5 : 0) }));
  return (
    <G>
      <AnimatedRect x={-22} y={12} width={16} height={28} rx={8} fill={palette.brownSoft} animatedProps={left} />
      <AnimatedRect x={6} y={12} width={16} height={28} rx={8} fill={palette.brownSoft} animatedProps={right} />
    </G>
  );
}

function Arm({ side, angle, time }: { side: -1 | 1; angle: number | 'swing'; time: SharedValue<number> }) {
  const palette = useArt();
  const pivotX = 22 * side;
  const pivotY = -14;
  const swing = useAnimatedProps(() => {
    const degrees = angle === 'swing' ? 14 + 16 * wave(time.value, 1.1) : angle;
    return { matrix: rotateAbout(-degrees * side, pivotX, pivotY) };
  });
  return (
    <AnimatedG animatedProps={swing as object}>
      <Rect x={pivotX - 7.5} y={pivotY - 4} width={15} height={30} rx={7.5} fill={palette.brownSoft} />
    </AnimatedG>
  );
}

function Satchel() {
  const palette = useArt();
  return (
    <G>
      <Path d="M -20 -22 L 22 12" stroke={palette.leather} strokeWidth={5} strokeLinecap="round" />
      <G transform="translate(14 4) rotate(-6)">
        <G transform="rotate(16 10 -2)">
          <Rect x={4} y={-15} width={11} height={22} rx={5.5} fill={palette.cream} />
          <Rect x={4} y={-8} width={11} height={3.5} fill={palette.rust} />
        </G>
        <Rect x={0} y={0} width={26} height={21} rx={6} fill={palette.leather} />
        <Path d="M 0 7 Q 0 0 6 0 L 20 0 Q 26 0 26 7 L 26 9 Q 13 15 0 9 Z" fill={palette.leatherDeep} />
        <Circle cx={13} cy={11} r={2.6} fill={palette.khaki} />
      </G>
    </G>
  );
}

function OpenMap() {
  const palette = useArt();
  return (
    <G transform="translate(0 10)">
      <Rect x={-22} y={-11} width={44} height={24} rx={3} fill={palette.cream} />
      <Path d="M -14 6 Q -8 -6 0 2 Q 6 8 12 -4" stroke={palette.rust} strokeWidth={1.8} strokeDasharray="3 3" strokeLinecap="round" fill="none" />
      <Path d="M 10 -7 L 15 -2 M 15 -7 L 10 -2" stroke={palette.rustDeep} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={-27} y={-13} width={8} height={28} rx={4} fill={palette.creamDeep} />
      <Rect x={19} y={-13} width={8} height={28} rx={4} fill={palette.creamDeep} />
    </G>
  );
}

function WalkingStick() {
  const palette = useArt();
  return (
    <G transform="translate(30 -14)">
      <Rect x={-3} y={0} width={6} height={56} rx={3} fill={palette.bamboo} />
      <Rect x={-3.5} y={16} width={7} height={2.5} rx={1.25} fill={palette.bambooDeep} />
      <Rect x={-3.5} y={36} width={7} height={2.5} rx={1.25} fill={palette.bambooDeep} />
      <Path d="M 1 2 Q 12 -8 18 -4 Q 10 4 1 2 Z" fill={palette.bambooDeep} />
    </G>
  );
}

function FlagPole({ x }: { x: number }) {
  const palette = useArt();
  return (
    <G>
      <Ellipse cx={x} cy={GROUND + 1} rx={18} ry={6} fill={palette.khakiDeep} />
      <Rect x={x - 3} y={56} width={6} height={GROUND - 54} rx={3} fill={palette.leatherDeep} />
      <Path d={`M ${x + 2} 58 Q ${x + 24} 62 ${x + 42} 70 Q ${x + 24} 80 ${x + 2} 84 Z`} fill={palette.fire} strokeLinejoin="round" />
      <G transform={`translate(${x + 18} 71)`}>
        <Ellipse cx={0} cy={2} rx={4.2} ry={3.4} fill={palette.rust} />
        <Circle cx={-4.4} cy={-2.6} r={1.7} fill={palette.rust} />
        <Circle cx={-1.4} cy={-4.6} r={1.7} fill={palette.rust} />
        <Circle cx={2} cy={-4.4} r={1.7} fill={palette.rust} />
        <Circle cx={4.8} cy={-2} r={1.7} fill={palette.rust} />
      </G>
      <Circle cx={x} cy={55} r={4} fill={palette.fireDeep} />
    </G>
  );
}

const SPARKLES = [
  { x: 40, y: 70, r: 9, color: 'fire', phase: 0 },
  { x: 198, y: 62, r: 11, color: 'orange', phase: 1.3 },
  { x: 206, y: 140, r: 7, color: 'bamboo', phase: 2.1 },
  { x: 32, y: 150, r: 8, color: 'mist', phase: 0.7 },
  { x: 182, y: 22, r: 6, color: 'rust', phase: 2.8 },
] as const;

function Sparkles({ time }: { time: SharedValue<number> }) {
  return (
    <G>
      {SPARKLES.map((sparkle) => (
        <Sparkle key={`${sparkle.x}-${sparkle.y}`} {...sparkle} time={time} />
      ))}
    </G>
  );
}

function Sparkle({ x, y, r, color, phase, time }: { x: number; y: number; r: number; color: keyof ArtPalette; phase: number; time: SharedValue<number> }) {
  const palette = useArt();
  const twinkle = useAnimatedProps(() => {
    const s = time.value === 0 ? 1 : 0.75 + 0.25 * wave(time.value, 1.4, phase);
    return { matrix: [s, 0, 0, s, x * (1 - s), y * (1 - s)] as Matrix };
  });
  const k = r * 0.28;
  return (
    <AnimatedG animatedProps={twinkle as object}>
      <Path
        d={`M ${x} ${y - r} Q ${x + k} ${y - k} ${x + r} ${y} Q ${x + k} ${y + k} ${x} ${y + r} Q ${x - k} ${y + k} ${x - r} ${y} Q ${x - k} ${y - k} ${x} ${y - r} Z`}
        fill={palette[color]}
      />
    </AnimatedG>
  );
}

function TentScene({ time }: { time: SharedValue<number> }) {
  const palette = useArt();
  const breath = useAnimatedProps(() => {
    const s = 1 + 0.03 * wave(time.value, 3.6);
    return { matrix: [1, 0, 0, s, 0, 196 * (1 - s)] as Matrix };
  });
  return (
    <G>
      <Ellipse cx={120} cy={GROUND} rx={96} ry={6} fill={palette.brown} opacity={0.14} />
      <Rect x={118.5} y={40} width={3} height={22} rx={1.5} fill={palette.leatherDeep} />
      <Path d="M 121 41 Q 130 43 138 46 Q 130 50 121 52 Z" fill={palette.rust} />
      <Path
        d="M 120 56 Q 125 56 128 62 L 202 196 Q 207 207 196 207 L 44 207 Q 33 207 38 196 L 112 62 Q 115 56 120 56 Z"
        fill={palette.bamboo}
      />
      <Path d="M 120 80 Q 122 80 123.5 84 L 170 207 L 70 207 L 116.5 84 Q 118 80 120 80 Z" fill={palette.eye} opacity={0.82} />
      <Path d="M 116.5 84 L 70 207 L 52 207 Q 82 146 116.5 84 Z" fill={palette.bambooDeep} />
      <Path d="M 123.5 84 L 170 207 L 188 207 Q 158 146 123.5 84 Z" fill={palette.bambooDeep} />
      <AnimatedG animatedProps={breath as object}>
        <Ellipse cx={116} cy={196} rx={34} ry={13} fill={palette.rust} />
        <G transform="translate(150 192) rotate(-4)">
          <Rect x={-16} y={-4} width={32} height={18} rx={6} fill={palette.leather} />
          <Path d="M -16 3 Q -16 -4 -10 -4 L 10 -4 Q 16 -4 16 3 L 16 5 Q 0 11 -16 5 Z" fill={palette.leatherDeep} />
        </G>
        <G transform="translate(122 168) rotate(10) scale(0.62)">
          <Head expression="sleepy" time={time} />
        </G>
        <Path d="M 148 203 C 136 214 96 214 84 199" stroke={palette.rust} strokeWidth={13} strokeLinecap="round" fill="none" />
        <Path d="M 148 203 C 136 214 96 214 84 199" stroke={palette.rustDeep} strokeWidth={13} strokeDasharray="6 7" fill="none" />
      </AnimatedG>
      <Snores time={time} />
    </G>
  );
}

function Snores({ time }: { time: SharedValue<number> }) {
  return (
    <G>
      {[0, 1, 2].map((i) => (
        <Snore key={i} index={i} time={time} />
      ))}
    </G>
  );
}

function Snore({ index, time }: { index: number; time: SharedValue<number> }) {
  const palette = useArt();
  const size = 7 + index * 2.5;
  const baseX = 160 + index * 13;
  const baseY = 128 - index * 20;
  const drift = useAnimatedProps(() => {
    if (time.value === 0) return { matrix: translate(0, 0), opacity: 1 };
    const phase = ((time.value / 3 + index / 3) % 1 + 1) % 1;
    return { matrix: translate(phase * 8, -phase * 14), opacity: Math.sin(phase * Math.PI) };
  });
  return (
    <AnimatedG animatedProps={drift as object}>
      <Path
        d={`M ${baseX} ${baseY} L ${baseX + size} ${baseY} L ${baseX} ${baseY + size} L ${baseX + size} ${baseY + size}`}
        stroke={palette.mistDeep}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </AnimatedG>
  );
}

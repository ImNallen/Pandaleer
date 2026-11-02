import { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

import { useArt } from '@/ui/tokens';

import { AnimatedG, useSvgId } from '../motion';

export type Expression = 'content' | 'excited' | 'sleepy';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

/** Head centred on (0, 0): about 112 wide and 92 tall, ears and hat reach up to y = -72. */
export function Head({ expression, time }: { expression: Expression; time: SharedValue<number> }) {
  const palette = useArt();
  return (
    <G>
      <Ear />
      <G transform="scale(-1 1)">
        <Ear />
      </G>
      <Ellipse cx={0} cy={0} rx={56} ry={46} fill={palette.rust} />
      <CheekTuft />
      <G transform="scale(-1 1)">
        <CheekTuft />
      </G>
      <Ellipse cx={-24} cy={-18} rx={8.5} ry={5.5} fill={palette.face} />
      <Ellipse cx={24} cy={-18} rx={8.5} ry={5.5} fill={palette.face} />
      <Ellipse cx={0} cy={25} rx={19} ry={14} fill={palette.face} />
      <Blush expression={expression} />
      {expression === 'sleepy' ? (
        <>
          <ClosedEye cx={-23} />
          <ClosedEye cx={23} />
        </>
      ) : (
        <>
          <OpenEye cx={-23} big={expression === 'excited'} time={time} />
          <OpenEye cx={23} big={expression === 'excited'} time={time} />
        </>
      )}
      <Path d="M -6.5 14 Q 0 10.5 6.5 14 Q 4 20.5 0 21 Q -4 20.5 -6.5 14 Z" fill={palette.eye} />
      <Mouth expression={expression} />
      <G transform="translate(2 -45) rotate(-7)">
        <Hat />
      </G>
    </G>
  );
}

function Ear() {
  const palette = useArt();
  return (
    <G>
      <Path d="M -54 -18 C -64 -46 -58 -66 -45 -70 C -33 -68 -22 -55 -15 -40 Z" fill={palette.face} />
      <Path d="M -47 -24 C -54 -43 -51 -57 -44 -60 C -37 -58 -30 -50 -26 -40 Z" fill={palette.brownSoft} />
    </G>
  );
}

function CheekTuft() {
  const palette = useArt();
  return (
    <Path
      d="M -16 34 C -24 18 -36 8 -50 8 Q -58 8 -65 12 Q -60 16 -57 18 Q -63 22 -66 27 Q -59 28 -55 29 Q -58 33 -58 37 C -44 42 -28 42 -16 34 Z"
      fill={palette.face}
    />
  );
}

function Blush({ expression }: { expression: Expression }) {
  const palette = useArt();
  const opacity = expression === 'excited' ? 0.85 : 0.6;
  return (
    <>
      <Ellipse cx={-37} cy={20} rx={7} ry={4} fill={palette.blush} opacity={opacity} />
      <Ellipse cx={37} cy={20} rx={7} ry={4} fill={palette.blush} opacity={opacity} />
    </>
  );
}

function openness(t: number): number {
  'worklet';
  const period = 4.6;
  const closeAt = 4.36;
  const phase = t % period;
  if (t === 0 || phase < closeAt) return 1;
  return 1 - 0.9 * Math.sin(((phase - closeAt) / (period - closeAt)) * Math.PI);
}

function OpenEye({ cx, big, time }: { cx: number; big: boolean; time: SharedValue<number> }) {
  const palette = useArt();
  const ry = big ? 11.5 : 10.5;
  const eye = useAnimatedProps(() => ({ ry: ry * openness(time.value) }));
  const shine = useAnimatedProps(() => ({ opacity: openness(time.value) > 0.6 ? 1 : 0 }));
  return (
    <G>
      <AnimatedEllipse cx={cx} cy={3} rx={big ? 10 : 9} ry={ry} fill={palette.eye} animatedProps={eye} />
      <AnimatedG animatedProps={shine}>
        <Circle cx={cx - 2.8} cy={-1.5} r={big ? 3.8 : 3.3} fill={palette.shine} />
        <Circle cx={cx + 3} cy={6.5} r={1.6} fill={palette.shine} />
        {big && <Circle cx={cx + 3.6} cy={-2.5} r={1.2} fill={palette.shine} />}
      </AnimatedG>
    </G>
  );
}

function ClosedEye({ cx }: { cx: number }) {
  const palette = useArt();
  return (
    <Path
      d={`M ${cx - 7.5} 3 Q ${cx} 10 ${cx + 7.5} 3`}
      stroke={palette.eye}
      strokeWidth={2.8}
      strokeLinecap="round"
      fill="none"
    />
  );
}

const MOUTHS: Record<Expression, { d: string; filled: boolean }> = {
  content: { d: 'M -7 25 Q -3.5 29 0 25 Q 3.5 29 7 25', filled: false },
  excited: { d: 'M -7.5 25 Q 0 37 7.5 25 Z', filled: true },
  sleepy: { d: 'M -3 26.5 Q 0 28.5 3 26.5', filled: false },
};

function Mouth({ expression }: { expression: Expression }) {
  const palette = useArt();
  const mouth = MOUTHS[expression];
  if (!mouth.filled) {
    return <Path d={mouth.d} stroke={palette.eye} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
  }
  return (
    <G>
      <Path d={mouth.d} fill={palette.eye} strokeLinejoin="round" />
      <Ellipse cx={0} cy={30.5} rx={3.4} ry={2.2} fill={palette.blush} />
    </G>
  );
}

/** Pith helmet with its brim centred on (0, 0). */
export function Hat() {
  const palette = useArt();
  const clipId = useSvgId('hat');
  const dome = 'M -21 -2 C -21 -29 21 -29 21 -2 Z';
  return (
    <G>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={dome} />
        </ClipPath>
      </Defs>
      <Ellipse cx={0} cy={1} rx={33} ry={7.5} fill={palette.khakiDeep} />
      <Ellipse cx={0} cy={-0.5} rx={32} ry={6} fill={palette.khaki} />
      <Path d={dome} fill={palette.khaki} />
      <Rect x={-22} y={-9.5} width={44} height={6} fill={palette.brownSoft} clipPath={`url(#${clipId})`} />
      <Circle cx={0} cy={-23} r={2.6} fill={palette.khakiDeep} />
    </G>
  );
}

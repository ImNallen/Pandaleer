import {
  BlendColor,
  Circle,
  DashPathEffect,
  Group,
  Morphology,
  Oval,
  Paint,
  Path,
  RadialGradient,
  RoundedRect,
  Skia,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { useArt, type ArtPalette } from '@/ui/tokens';

export type PandaStyle = 'flat' | 'soft' | 'outlined';
export type PandaMood = 'idle' | 'proud' | 'cheer';

type Props = { mood: PandaMood; look: PandaStyle; time: SharedValue<number> };

/** Feet rest on this line; breathing and hops pivot around it. */
export const GROUND = 212;
const CX = 120;

const svg = (d: string): SkPath => Skia.Path.MakeFromSVGString(d)!;

const SHAPES = {
  head: svg(
    'M 120 50 C 154 50 180 66 183 94 C 184 106 182 116 176 124 C 166 139 146 147 120 147 C 94 147 74 139 64 124 C 58 116 56 106 57 94 C 60 66 86 50 120 50 Z',
  ),
  earOuter: svg('M 64 84 C 54 60 60 36 80 30 C 96 28 108 42 110 58 Z'),
  earInner: svg('M 72 78 C 66 60 70 44 82 41 C 92 40 99 49 101 60 Z'),
  cheek: svg(
    'M 94 108 C 83 104 70 106 60 113 Q 64 116 66 118 Q 57 122 53 128 Q 61 129 65 131 Q 61 136 63 141 C 76 147 90 142 97 131 Z',
  ),
  body: svg('M 82 168 C 82 142 98 132 120 132 C 142 132 158 142 158 168 C 158 192 143 204 120 204 C 97 204 82 192 82 168 Z'),
  belly: svg('M 94 190 C 102 200 138 200 146 190 C 140 202 130 205 120 205 C 110 205 100 202 94 190 Z'),
  tail: svg('M 104 194 C 76 206 54 196 50 174 C 47 158 54 146 64 140'),
  nose: svg('M 112.5 116 Q 120 111.5 127.5 116 Q 124 123.5 120 123.5 Q 116 123.5 112.5 116 Z'),
  mouth: svg('M 112.5 128.5 Q 116.25 132.5 120 128.5 Q 123.75 132.5 127.5 128.5'),
  grin: svg('M 112 127.5 Q 120 140 128 127.5 Z'),
  hatDome: svg('M 98 52 C 98 30 142 30 142 52 Z'),
  strap: svg('M 100 140 L 152 182'),
  flap: svg('M 140 178 Q 140 172 146 172 L 160 172 Q 166 172 166 178 L 166 181 Q 153 187 140 181 Z'),
  arm: svg('M -8 0 C -8 -5 8 -5 8 0 L 8 22 C 8 30 -8 30 -8 22 Z'),
  sparkle: svg('M 0 -10 Q 2.8 -2.8 10 0 Q 2.8 2.8 0 10 Q -2.8 2.8 -10 0 Q -2.8 -2.8 0 -10 Z'),
  flagCloth: svg('M 203 92 Q 222 96 234 104 Q 222 112 203 116 Z'),
};

const mirror = [{ translateX: 2 * CX }, { scaleX: -1 }];

/** The red panda explorer drawn in Skia. Every moving part reads the same clock, so copies of the scene stay in step. */
export function PandaScene({ mood, look, time }: Props) {
  const palette = useArt();
  const scene = <Character mood={mood} look={look} time={time} palette={palette} />;
  const outline = look === 'outlined' ? { radius: 3.2, color: palette.brown } : { radius: 2, color: palette.halo };
  return (
    <>
      <GroundShadow mood={mood} time={time} palette={palette} />
      <Group
        layer={
          <Paint>
            <Morphology radius={outline.radius} operator="dilate" />
            <BlendColor color={outline.color} mode="srcIn" />
          </Paint>
        }>
        {scene}
      </Group>
      {scene}
    </>
  );
}

function Character({ mood, look, time, palette }: Props & { palette: ArtPalette }) {
  const cheering = mood === 'cheer';

  const breathing = useDerivedValue(() => [{ translateY: lift(time.value, cheering) }, { scaleY: 1 + 0.016 * Math.sin(time.value * 1.9) }]);
  const headBob = useDerivedValue(() => [{ translateY: 1.4 * Math.sin(time.value * 1.9 - 0.6) }, { rotate: 0.03 * Math.sin(time.value * 0.7) }]);
  const tailSway = useDerivedValue(() => [{ rotate: 0.12 * Math.sin(time.value * 2.3) }]);

  return (
    <Group>
      {mood !== 'idle' && <Flag palette={palette} look={look} />}
      {cheering && <Sparkles time={time} palette={palette} />}
      <Group transform={breathing} origin={vec(CX, GROUND)}>
        <Group transform={tailSway} origin={vec(104, 194)}>
          <Tail palette={palette} />
        </Group>
        <Oval x={58} y={150} width={52} height={54} color={palette.rust} />
        <Oval x={92} y={192} width={26} height={20} color={palette.brownSoft} />
        <Oval x={122} y={192} width={26} height={20} color={palette.brownSoft} />
        <Shaded path={SHAPES.body} base={palette.rust} deep={palette.rustDeep} look={look} light={vec(108, 146)} radius={70} />
        <Path path={SHAPES.belly} color={palette.rustDeep} opacity={0.55} />
        <Satchel palette={palette} />
        <Arms mood={mood} time={time} palette={palette} />
        <Group transform={headBob} origin={vec(CX, 140)}>
          <Head mood={mood} look={look} time={time} palette={palette} />
        </Group>
      </Group>
    </Group>
  );
}

function lift(t: number, cheering: boolean): number {
  'worklet';
  if (!cheering || t === 0) return 0;
  const phase = t % 1.25;
  return phase < 0.55 ? -Math.sin((phase / 0.55) * Math.PI) * 20 : 0;
}

/** Shrinks as the panda hops; drawn outside the outline so it stays a soft blur of shade. */
function GroundShadow({ mood, time, palette }: { mood: PandaMood; time: SharedValue<number>; palette: ArtPalette }) {
  const cheering = mood === 'cheer';
  const scale = useDerivedValue(() => [{ scaleX: 1 + lift(time.value, cheering) / 70 }]);
  return (
    <Group transform={scale} origin={vec(CX, GROUND)}>
      <Oval x={CX - 46} y={GROUND - 6} width={92} height={13} color={palette.brown} opacity={0.12} />
    </Group>
  );
}

/** A filled shape; the soft look adds one gentle gradient toward the shape's deeper tone. */
function Shaded({ path, base, deep, look, light, radius }: { path: SkPath; base: string; deep: string; look: PandaStyle; light: { x: number; y: number }; radius: number }) {
  if (look !== 'soft') return <Path path={path} color={base} />;
  return (
    <Path path={path}>
      <RadialGradient c={light} r={radius} colors={[lighten(base), base, deep]} positions={[0, 0.55, 1]} />
    </Path>
  );
}

function Tail({ palette }: { palette: ArtPalette }) {
  return (
    <Group>
      <Path path={SHAPES.tail} style="stroke" strokeWidth={25} strokeCap="round" color={palette.rust} />
      <Path path={SHAPES.tail} style="stroke" strokeWidth={25} color={palette.rustDeep}>
        <DashPathEffect intervals={[9, 10]} phase={-14} />
      </Path>
    </Group>
  );
}

function Arms({ mood, time, palette }: { mood: PandaMood; time: SharedValue<number>; palette: ArtPalette }) {
  const raised = mood === 'cheer';
  const wave = useDerivedValue(() => (raised ? 0.15 * Math.sin(time.value * 9) : 0.04 * Math.sin(time.value * 1.9)));
  const left = useDerivedValue(() => [{ translateX: 92 }, { translateY: 146 }, { rotate: (raised ? 2.3 : 0.32) + wave.value }]);
  const right = useDerivedValue(() => [{ translateX: 148 }, { translateY: 146 }, { rotate: -(raised ? 2.3 : 0.32) - wave.value }]);
  return (
    <>
      <Group transform={left}>
        <Path path={SHAPES.arm} color={palette.brownSoft} />
      </Group>
      <Group transform={right}>
        <Path path={SHAPES.arm} color={palette.brownSoft} />
      </Group>
    </>
  );
}

function Satchel({ palette }: { palette: ArtPalette }) {
  return (
    <Group>
      <Path path={SHAPES.strap} style="stroke" strokeWidth={5} strokeCap="round" color={palette.leather} />
      <RoundedRect x={140} y={172} width={26} height={22} r={7} color={palette.leather} />
      <Path path={SHAPES.flap} color={palette.leatherDeep} />
      <Circle cx={153} cy={184} r={2.6} color={palette.khaki} />
    </Group>
  );
}

function Head({ mood, look, time, palette }: { mood: PandaMood; look: PandaStyle; time: SharedValue<number>; palette: ArtPalette }) {
  const excited = mood !== 'idle';
  const earTwitch = useDerivedValue(() => {
    const phase = time.value % 5.3;
    return [{ rotate: phase > 4.9 ? -0.18 * Math.sin(((phase - 4.9) / 0.4) * Math.PI) : 0 }];
  });
  return (
    <Group>
      <Ear palette={palette} />
      <Group transform={mirror}>
        <Group transform={earTwitch} origin={vec(90, 70)}>
          <Ear palette={palette} />
        </Group>
      </Group>
      <Shaded path={SHAPES.head} base={palette.rust} deep={palette.rustDeep} look={look} light={vec(100, 76)} radius={96} />
      <Path path={SHAPES.cheek} color={palette.face} />
      <Group transform={mirror}>
        <Path path={SHAPES.cheek} color={palette.face} />
      </Group>
      <Oval x={86} y={74} width={20} height={12} color={palette.face} />
      <Oval x={134} y={74} width={20} height={12} color={palette.face} />
      <Oval x={97} y={109} width={46} height={32} color={palette.face} />
      <Oval x={76} y={118} width={18} height={10} color={palette.blush} opacity={excited ? 0.8 : 0.55} />
      <Oval x={146} y={118} width={18} height={10} color={palette.blush} opacity={excited ? 0.8 : 0.55} />
      <Eye cx={100} time={time} excited={excited} palette={palette} />
      <Eye cx={140} time={time} excited={excited} palette={palette} />
      <Path path={SHAPES.nose} color={palette.eye} />
      {excited ? (
        <Group>
          <Path path={SHAPES.grin} color={palette.eye} />
          <Oval x={116} y={132} width={8} height={5} color={palette.blush} />
        </Group>
      ) : (
        <Path path={SHAPES.mouth} style="stroke" strokeWidth={2.4} strokeCap="round" strokeJoin="round" color={palette.eye} />
      )}
      <Group transform={[{ rotate: -0.1 }]} origin={vec(CX, 52)}>
        <Hat palette={palette} look={look} />
      </Group>
    </Group>
  );
}

function Ear({ palette }: { palette: ArtPalette }) {
  return (
    <Group>
      <Path path={SHAPES.earOuter} color={palette.face} />
      <Path path={SHAPES.earInner} color={palette.brownSoft} />
    </Group>
  );
}

function blink(t: number): number {
  'worklet';
  const phase = t % 4.4;
  if (t === 0 || phase < 4.2) return 1;
  return 1 - 0.92 * Math.sin(((phase - 4.2) / 0.2) * Math.PI);
}

function Eye({ cx, time, excited, palette }: { cx: number; time: SharedValue<number>; excited: boolean; palette: ArtPalette }) {
  const open = useDerivedValue(() => [{ scaleY: blink(time.value) }]);
  const shine = useDerivedValue(() => (blink(time.value) > 0.6 ? 1 : 0));
  const r = excited ? 1.08 : 1;
  return (
    <Group transform={open} origin={vec(cx, 102)}>
      <Oval x={cx - 10 * r} y={102 - 12.5 * r} width={20 * r} height={25 * r} color={palette.eye} />
      <Group opacity={shine}>
        <Circle cx={cx - 3.6} cy={96.5} r={4.4 * r} color={palette.shine} />
        <Circle cx={cx + 4} cy={107.5} r={2} color={palette.shine} />
        {excited && <Circle cx={cx + 4.5} cy={95} r={1.5} color={palette.shine} />}
      </Group>
    </Group>
  );
}

function Hat({ palette, look }: { palette: ArtPalette; look: PandaStyle }) {
  return (
    <Group>
      <Oval x={CX - 38} y={46} width={76} height={16} color={palette.khakiDeep} />
      <Oval x={CX - 37} y={44} width={74} height={13} color={palette.khaki} />
      <Shaded path={SHAPES.hatDome} base={palette.khaki} deep={palette.khakiDeep} look={look} light={vec(110, 36)} radius={34} />
      <Group clip={SHAPES.hatDome}>
        <RoundedRect x={96} y={42} width={48} height={7} r={1} color={palette.brownSoft} />
      </Group>
      <Circle cx={CX} cy={30} r={3} color={palette.khakiDeep} />
    </Group>
  );
}

function Flag({ palette, look }: { palette: ArtPalette; look: PandaStyle }) {
  return (
    <Group>
      <Oval x={184} y={GROUND - 7} width={38} height={12} color={palette.khakiDeep} />
      <RoundedRect x={200} y={88} width={6} height={GROUND - 86} r={3} color={palette.leatherDeep} />
      <Shaded path={SHAPES.flagCloth} base={palette.fire} deep={palette.fireDeep} look={look} light={vec(210, 98)} radius={30} />
      <Circle cx={203} cy={87} r={4.5} color={palette.fireDeep} />
    </Group>
  );
}

const SPARKLES = [
  { x: 40, y: 64, s: 1, color: 'fire', phase: 0 },
  { x: 200, y: 56, s: 1.2, color: 'orange', phase: 1.3 },
  { x: 212, y: 150, s: 0.8, color: 'bamboo', phase: 2.1 },
  { x: 30, y: 150, s: 0.9, color: 'mist', phase: 0.7 },
] as const;

function Sparkles({ time, palette }: { time: SharedValue<number>; palette: ArtPalette }) {
  return (
    <>
      {SPARKLES.map((sparkle) => (
        <Sparkle key={sparkle.x} {...sparkle} time={time} color={palette[sparkle.color]} />
      ))}
    </>
  );
}

function Sparkle({ x, y, s, color, phase, time }: { x: number; y: number; s: number; color: string; phase: number; time: SharedValue<number> }) {
  const twinkle = useDerivedValue(() => [{ translateX: x }, { translateY: y }, { scale: s * (0.75 + 0.25 * Math.sin(time.value * 4.5 + phase)) }]);
  return (
    <Group transform={twinkle}>
      <Path path={SHAPES.sparkle} color={color} />
    </Group>
  );
}

function lighten(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.28);
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

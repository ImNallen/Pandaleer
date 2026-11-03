import { Circle, Group, Oval, Path, Skia, vec, type SkPath } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

/** Colours for every part. The silhouette uses one colour for all of them except the tail rings. */
export type PandaColors = {
  fur: string;
  cream: string;
  tailCream: string;
  limb: string;
  earInner: string;
  eye: string;
  shine: string;
};

export const RED_PANDA: PandaColors = {
  fur: '#C9532C',
  cream: '#F8DDC7',
  tailCream: '#F6C9A5',
  limb: '#56261A',
  earInner: '#8D331F',
  eye: '#3B1C13',
  shine: '#FFFFFF',
};

export const silhouetteOf = (color: string, rings: string): PandaColors => ({
  fur: color,
  cream: color,
  tailCream: rings,
  limb: color,
  earInner: color,
  eye: color,
  shine: color,
});

export type PandaMotion = 'idle' | 'walk' | 'cheer';

/** Ground line and the vertical extent of the drawing, for anything that fills or frames it. */
export const PANDA_BOUNDS = { top: 24, bottom: 207 };

const svg = (d: string): SkPath => Skia.Path.MakeFromSVGString(d)!;

/** Shapes in a 240 × 240 box, traced from the Pandaleer reference: a three-quarter view looking a little to the right. */
const SHAPES = {
  head: svg('M 142 36 C 177 36 202 58 204 88 C 205 106 198 119 186 126 C 174 133 158 135 140 135 C 120 135 100 132 89 124 C 78 116 75 102 77 88 C 81 58 107 36 142 36 Z'),
  leftEar: svg('M 80 80 C 70 64 70 44 82 36 C 94 30 108 40 114 54 Z'),
  leftEarInner: svg('M 86 72 C 80 60 80 48 87 44 C 95 41 103 48 107 57 Z'),
  rightEar: svg('M 164 50 C 170 36 184 26 196 30 C 208 38 204 62 194 74 Z'),
  rightEarInner: svg('M 171 52 C 176 42 186 36 193 39 C 200 46 198 60 191 68 Z'),
  leftCheek: svg('M 82 98 C 90 92 104 92 116 96 Q 110 101 114 104 Q 107 107 112 111 Q 104 114 108 119 C 98 124 88 122 82 116 C 78 110 78 102 82 98 Z'),
  rightCheek: svg('M 178 92 C 186 84 200 84 205 92 C 208 100 204 110 195 113 Q 192 108 187 110 Q 186 104 181 104 Q 180 98 176 98 Q 175 94 178 92 Z'),
  nose: svg('M 145.5 93.5 Q 152 89.5 158.5 93.5 Q 156 100 152 100.5 Q 148 100 145.5 93.5 Z'),
  smile: svg('M 143 104.5 Q 151.5 113 160 104'),
  body: svg('M 112 132 C 98 142 92 160 94 176 C 96 190 110 196 136 196 C 160 196 176 188 180 172 C 184 156 176 140 162 132 Z'),
  arm: svg('M -9 0 C -9 -7 9 -7 9 0 L 10 26 C 10 36 -10 36 -10 26 Z'),
  leg: svg('M -9 0 L 9 0 L 9 18 C 9 22 11 24 14 25 C 18 27 17 32 12 32 L -4 32 C -9 32 -10 28 -9 24 Z'),
  sparkle: svg('M 0 -9 Q 2.5 -2.5 9 0 Q 2.5 2.5 0 9 Q -2.5 2.5 -9 0 Q -2.5 -2.5 0 -9 Z'),
};

const TAIL = { x: 74, y: 150, rx: 32, ry: 48, angle: -0.55 };

type Props = { colors: PandaColors; motion: PandaMotion; time: SharedValue<number> };

/** The Pandaleer red panda, rigged so its legs, arms, tail, head and ears can move. */
export function RedPanda({ colors, motion, time }: Props) {
  const walking = motion === 'walk';
  const cheering = motion === 'cheer';
  const step = (t: number) => {
    'worklet';
    return walking ? Math.sin(t * 6.2) : 0;
  };

  const body = useDerivedValue(() => {
    const t = time.value;
    const bob = walking ? -2.4 * Math.abs(Math.sin(t * 6.2)) : cheering ? hop(t) : 0;
    return [{ translateY: bob }, { scaleY: 1 + 0.014 * Math.sin(t * 1.9) }];
  });
  const head = useDerivedValue(() => {
    const t = time.value;
    return [{ translateY: 1.2 * Math.sin(t * (walking ? 12.4 : 1.9) - 0.5) }, { rotate: 0.035 * Math.sin(t * (walking ? 6.2 : 0.8)) }];
  });
  const tail = useDerivedValue(() => [{ rotate: (walking ? 0.16 : 0.08) * Math.sin(time.value * (walking ? 6.2 : 2.2)) }]);
  const leftLeg = useDerivedValue(() => [{ translateX: 109 }, { translateY: 178 }, { rotate: 0.12 + 0.42 * step(time.value) }]);
  const rightLeg = useDerivedValue(() => [{ translateX: 158 }, { translateY: 178 }, { rotate: -0.3 - 0.42 * step(time.value) }]);
  const leftArm = useDerivedValue(() => {
    const swing = walking ? -0.45 * step(time.value) : cheering ? 2.5 + 0.15 * Math.sin(time.value * 9) : 0.12;
    return [{ translateX: 104 }, { translateY: 142 }, { rotate: swing }];
  });
  const rightArm = useDerivedValue(() => {
    const t = time.value;
    const wave = cheering ? 0.2 * Math.sin(t * 9) : 0.22 * Math.sin(t * (walking ? 6.2 : 3.1));
    return [{ translateX: 168 }, { translateY: 146 }, { rotate: -2.35 + wave }];
  });
  const earTwitch = useDerivedValue(() => {
    const phase = time.value % 5.3;
    return [{ rotate: phase > 4.9 ? 0.2 * Math.sin(((phase - 4.9) / 0.4) * Math.PI) : 0 }];
  });
  const blink = useDerivedValue(() => {
    const t = time.value;
    const phase = t % 4.4;
    return [{ scaleY: t === 0 || phase < 4.22 ? 1 : 1 - 0.9 * Math.sin(((phase - 4.22) / 0.18) * Math.PI) }];
  });

  return (
    <Group>
      {cheering && <Sparkles time={time} color={colors.tailCream} />}
      <Group transform={body} origin={vec(137, 207)}>
        <Group transform={tail} origin={vec(104, 178)}>
          <Tail colors={colors} />
        </Group>
        <Group transform={leftLeg}>
          <Path path={SHAPES.leg} color={colors.limb} transform={[{ scaleX: -1 }]} />
        </Group>
        <Group transform={rightLeg}>
          <Path path={SHAPES.leg} color={colors.limb} />
        </Group>
        <Path path={SHAPES.body} color={colors.fur} />
        <Oval x={118} y={136} width={38} height={50} color={colors.cream} />
        <Group transform={leftArm}>
          <Path path={SHAPES.arm} color={colors.limb} />
        </Group>
        <Group transform={rightArm}>
          <Path path={SHAPES.arm} color={colors.limb} />
        </Group>
        <Group transform={head} origin={vec(140, 132)}>
          <Path path={SHAPES.leftEar} color={colors.cream} />
          <Path path={SHAPES.leftEarInner} color={colors.earInner} />
          <Group transform={earTwitch} origin={vec(186, 66)}>
            <Path path={SHAPES.rightEar} color={colors.cream} />
            <Path path={SHAPES.rightEarInner} color={colors.earInner} />
          </Group>
          <Path path={SHAPES.head} color={colors.fur} />
          <Oval x={110} y={66} width={20} height={10} color={colors.cream} transform={[{ rotate: -0.25 }]} origin={vec(120, 71)} />
          <Oval x={164} y={62} width={15} height={8} color={colors.cream} transform={[{ rotate: 0.2 }]} origin={vec(171, 66)} />
          <Path path={SHAPES.leftCheek} color={colors.cream} />
          <Path path={SHAPES.rightCheek} color={colors.cream} />
          <Oval x={119} y={90} width={52} height={40} color={colors.cream} />
          <Group transform={blink} origin={vec(148, 87)}>
            <Eye cx={128} cy={89} colors={colors} />
            <Eye cx={168.5} cy={85.5} colors={colors} />
          </Group>
          <Path path={SHAPES.nose} color={colors.eye} />
          <Path path={SHAPES.smile} style="stroke" strokeWidth={3} strokeCap="round" color={colors.eye} />
        </Group>
      </Group>
    </Group>
  );
}

function Tail({ colors }: { colors: PandaColors }) {
  const oval = Skia.XYWHRect(TAIL.x - TAIL.rx, TAIL.y - TAIL.ry, TAIL.rx * 2, TAIL.ry * 2);
  return (
    <Group transform={[{ rotate: TAIL.angle }]} origin={vec(TAIL.x, TAIL.y)}>
      <Oval rect={oval} color={colors.fur} />
      <Group clip={Skia.RRectXY(oval, TAIL.rx, TAIL.ry)}>
        {[-28, -2, 24].map((dy) => (
          <Oval key={dy} x={TAIL.x - TAIL.rx * 1.6} y={TAIL.y + dy - 7} width={TAIL.rx * 3.2} height={14} color={colors.tailCream} />
        ))}
      </Group>
    </Group>
  );
}

function Eye({ cx, cy, colors }: { cx: number; cy: number; colors: PandaColors }) {
  return (
    <Group>
      <Oval x={cx - 4.8} y={cy - 6} width={9.6} height={12} color={colors.eye} />
      <Circle cx={cx + 1.4} cy={cy - 2.4} r={1.7} color={colors.shine} />
    </Group>
  );
}

const SPARKLES = [
  { x: 40, y: 60, s: 1, phase: 0 },
  { x: 214, y: 40, s: 1.2, phase: 1.3 },
  { x: 222, y: 150, s: 0.8, phase: 2.1 },
  { x: 26, y: 180, s: 0.9, phase: 0.7 },
] as const;

function Sparkles({ time, color }: { time: SharedValue<number>; color: string }) {
  return (
    <>
      {SPARKLES.map((sparkle) => (
        <Sparkle key={sparkle.x} {...sparkle} time={time} color={color} />
      ))}
    </>
  );
}

function Sparkle({ x, y, s, phase, time, color }: { x: number; y: number; s: number; phase: number; time: SharedValue<number>; color: string }) {
  const twinkle = useDerivedValue(() => [{ translateX: x }, { translateY: y }, { scale: s * (0.75 + 0.25 * Math.sin(time.value * 4.5 + phase)) }]);
  return (
    <Group transform={twinkle}>
      <Path path={SHAPES.sparkle} color={color} />
    </Group>
  );
}

function hop(t: number): number {
  'worklet';
  if (t === 0) return 0;
  const phase = t % 1.25;
  return phase < 0.55 ? -Math.sin((phase / 0.55) * Math.PI) * 18 : 0;
}


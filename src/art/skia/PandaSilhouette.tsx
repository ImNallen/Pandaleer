import { DashPathEffect, Group, Path, RoundedRect, Skia, vec, type SkPath } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

const GROUND = 212;
const CX = 120;
const svg = (d: string): SkPath => Skia.Path.MakeFromSVGString(d)!;

/** Shapes chosen so the outline alone says "red panda": rounded ears, cheek tufts, a sitting pear body with feet peeking out and a ringed bushy tail with daylight around it. */
const SHAPES = {
  head: svg('M 120 62 C 155 62 177 80 177 102 C 177 124 153 140 120 140 C 87 140 63 124 63 102 C 63 80 85 62 120 62 Z'),
  ear: svg('M 70 92 C 62 78 62 62 70 54 C 76 48 84 48 92 54 C 98 58 103 64 106 72 Z'),
  tufts: svg('M 70 106 Q 60 108 52 114 Q 58 117 60 119 Q 51 125 51 133 Q 59 131 63 133 Q 61 139 65 143 C 78 145 88 138 92 128 Z'),
  body: svg('M 92 130 C 82 148 74 168 74 188 C 74 206 96 212 120 212 C 144 212 166 206 166 188 C 166 168 158 148 148 130 Z'),
  tail: svg(
    'M 94 206 C 72 214 48 208 40 192 Q 28 186 31 173 Q 25 160 31 149 Q 32 135 44 127 Q 50 113 64 109 C 75 104 85 110 79 118 C 65 126 56 144 58 162 C 60 180 74 190 90 190 Z',
  ),
  tailRings: svg('M 90 198 C 64 208 40 196 40 168 C 40 144 52 124 70 114'),
  arm: svg('M -8 0 C -8 -5 8 -5 8 0 L 8 24 C 8 32 -8 32 -8 24 Z'),
};

const mirror = [{ translateX: 2 * CX }, { scaleX: -1 }];

/** `rings`: tone-on-tone tail rings, the one detail that tells a red panda from a cat in silhouette. */
type Props = { color: string; rings?: string; time: SharedValue<number>; cheering: boolean };

/** The panda as one flat shape in `color`. Every moving part reads `time`, so stacked copies stay aligned. */
export function PandaSilhouette({ color, rings, time, cheering }: Props) {
  const body = useDerivedValue(() => [{ translateY: hop(time.value, cheering) }, { scaleY: 1 + 0.016 * Math.sin(time.value * 1.9) }]);
  const head = useDerivedValue(() => [{ translateY: 1.4 * Math.sin(time.value * 1.9 - 0.6) }, { rotate: 0.03 * Math.sin(time.value * 0.7) }]);
  const tail = useDerivedValue(() => [{ rotate: 0.1 * Math.sin(time.value * 2.3) }]);
  const ear = useDerivedValue(() => {
    const phase = time.value % 5.3;
    return [{ rotate: phase > 4.9 ? -0.2 * Math.sin(((phase - 4.9) / 0.4) * Math.PI) : 0 }];
  });
  const armSwing = useDerivedValue(() => (cheering ? 0.15 * Math.sin(time.value * 9) : 0.05 * Math.sin(time.value * 1.9)));
  const leftArm = useDerivedValue(() => [{ translateX: 100 }, { translateY: 146 }, { rotate: (cheering ? 2.4 : 0.35) + armSwing.value }]);
  const rightArm = useDerivedValue(() => [{ translateX: 140 }, { translateY: 146 }, { rotate: -(cheering ? 2.4 : 0.35) - armSwing.value }]);

  return (
    <Group transform={body} origin={vec(CX, GROUND)} color={color}>
      <Group transform={tail} origin={vec(92, 198)}>
        <Path path={SHAPES.tail} />
        {rings && (
          <Group clip={SHAPES.tail}>
            <Path path={SHAPES.tailRings} style="stroke" strokeWidth={48} color={rings}>
              <DashPathEffect intervals={[9, 11]} phase={-4} />
            </Path>
          </Group>
        )}
      </Group>
      <RoundedRect x={68} y={196} width={30} height={16} r={8} />
      <RoundedRect x={142} y={196} width={30} height={16} r={8} />
      <Path path={SHAPES.body} />
      <Group transform={leftArm}>
        <Path path={SHAPES.arm} />
      </Group>
      <Group transform={rightArm}>
        <Path path={SHAPES.arm} />
      </Group>
      <Group transform={head} origin={vec(CX, 140)}>
        <Path path={SHAPES.ear} />
        <Group transform={mirror}>
          <Group transform={ear} origin={vec(90, 76)}>
            <Path path={SHAPES.ear} />
          </Group>
        </Group>
        <Path path={SHAPES.head} />
        <Path path={SHAPES.tufts} />
        <Group transform={mirror}>
          <Path path={SHAPES.tufts} />
        </Group>
      </Group>
    </Group>
  );
}

function hop(t: number, cheering: boolean): number {
  'worklet';
  if (!cheering || t === 0) return 0;
  const phase = t % 1.25;
  return phase < 0.55 ? -Math.sin((phase / 0.55) * Math.PI) * 20 : 0;
}

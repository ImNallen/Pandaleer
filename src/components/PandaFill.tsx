import { Canvas, ColorMatrix, Group, Paint, Skia, type SkPath } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { PandaScene, type PandaMood, type PandaStyle } from '@/art/skia/PandaScene';
import { PandaSilhouette } from '@/art/skia/PandaSilhouette';
import { useSceneClock } from '@/art/skia/useSceneClock';
import { useTheme } from '@/ui/tokens';

/** The panda spans from the button on its hat to the soles of its feet. */
const TOP = 26;
const BOTTOM = 212;

/** `colour`: a grey panda that fills with its real colours. `water`: a flat silhouette that fills with light-blue water. */
export type FillMode = 'colour' | 'water' | 'water-rings';

type Props = { progress: number; size: number; celebrating: boolean; look?: PandaStyle; fill?: FillMode; animated?: boolean };

/** A grey silhouette of the panda that fills with colour, like liquid, as the day's steps add up. Both layers share one clock, so the panda keeps moving while it fills. */
export function PandaFill({ progress, size, celebrating, look = 'soft', fill = 'colour', animated = true }: Props) {
  const theme = useTheme();
  const time = useSceneClock(animated);
  const level = useSharedValue(0);
  const full = progress >= 1;
  const mood: PandaMood = full ? (celebrating ? 'cheer' : 'proud') : 'idle';

  useEffect(() => {
    level.value = withTiming(Math.min(1, progress), { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [progress, level]);

  const surface = useDerivedValue(() => liquid(level.value, time.value, 0));
  const backSurface = useDerivedValue(() => liquid(Math.min(1, level.value + 0.025), time.value, 2.1));
  const grey = useMemo(() => silhouetteMatrix(theme.silhouette, theme.silhouetteDeep), [theme.silhouette, theme.silhouetteDeep]);
  const scale = size / 240;
  const percent = Math.floor(Math.min(1, progress) * 100);

  return (
    <Canvas
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={full ? 'The red panda is full: goal reached!' : `The red panda is ${percent}% full`}>
      <Group transform={[{ scale }]}>
        {fill !== 'colour' ? (
          <WaterFill full={full} celebrating={celebrating} surface={surface} backSurface={backSurface} time={time} rings={fill === 'water-rings'} />
        ) : full ? (
          <PandaScene mood={mood} look={look} time={time} />
        ) : (
          <>
            <Group layer={<Paint><ColorMatrix matrix={grey} /></Paint>}>
              <PandaScene mood="idle" look={look} time={time} />
            </Group>
            <Group clip={surface}>
              <PandaScene mood="idle" look={look} time={time} />
            </Group>
          </>
        )}
      </Group>
    </Canvas>
  );
}

/** One flat shape, no features: grey where empty, light-blue water rising inside it, with a paler wave just behind. */
function WaterFill({ full, celebrating, surface, backSurface, time, rings }: { full: boolean; celebrating: boolean; surface: SharedValue<SkPath>; backSurface: SharedValue<SkPath>; time: SharedValue<number>; rings: boolean }) {
  const theme = useTheme();
  const ring = (color: string) => (rings ? color : undefined);
  const cheering = full && celebrating;
  if (full) return <PandaSilhouette color={theme.water} rings={ring(theme.waterRing)} time={time} cheering={cheering} />;
  return (
    <>
      <PandaSilhouette color={theme.silhouette} rings={ring(theme.silhouetteRing)} time={time} cheering={false} />
      <Group clip={backSurface}>
        <PandaSilhouette color={theme.waterSoft} rings={ring(theme.waterSoft)} time={time} cheering={false} />
      </Group>
      <Group clip={surface}>
        <PandaSilhouette color={theme.water} rings={ring(theme.waterRing)} time={time} cheering={false} />
      </Group>
    </>
  );
}

/** Everything below a gently rolling surface; the waves calm down near empty and full. */
function liquid(level: number, t: number, phase: number): SkPath {
  'worklet';
  const y = BOTTOM - level * (BOTTOM - TOP);
  const amplitude = 4 * Math.min(1, level * 8, (1 - level) * 8);
  const path = Skia.PathBuilder.Make();
  path.moveTo(-10, y);
  for (let x = -10; x <= 250; x += 10) {
    path.lineTo(x, y + amplitude * (Math.sin(x * 0.045 + t * 2.4 + phase) + 0.5 * Math.sin(x * 0.09 - t * 1.7 + phase)));
  }
  path.lineTo(250, 260);
  path.lineTo(-10, 260);
  path.close();
  return path.build();
}

/** Maps brightness onto two greys: dark details land on `deep`, light areas on `base`, alpha is kept. */
function silhouetteMatrix(base: string, deep: string): number[] {
  const [b, d] = [rgb(base), rgb(deep)];
  const row = (i: 0 | 1 | 2) => {
    const span = b[i] - d[i];
    return [0.299 * span, 0.587 * span, 0.114 * span, 0, d[i]];
  };
  return [...row(0), ...row(1), ...row(2), 0, 0, 0, 1, 0];
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

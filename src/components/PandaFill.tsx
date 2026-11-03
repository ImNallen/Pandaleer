import { Canvas, Group, Skia, type SkPath } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { PandaSilhouette } from '@/art/skia/PandaSilhouette';
import { useSceneClock } from '@/art/skia/useSceneClock';
import { useTheme } from '@/ui/tokens';

/** The silhouette spans from the tips of its ears to the soles of its feet. */
const TOP = 46;
const BOTTOM = 212;

type Props = { progress: number; size: number; celebrating: boolean; animated?: boolean };

/** The panda as a flat silhouette that fills with light-blue water as the day's steps add up. Every layer reads one clock, so it keeps moving while it fills. */
export function PandaFill({ progress, size, celebrating, animated = true }: Props) {
  const theme = useTheme();
  const time = useSceneClock(animated);
  const level = useSharedValue(0);
  const full = progress >= 1;

  useEffect(() => {
    level.value = withTiming(Math.min(1, progress), { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [progress, level]);

  const surface = useDerivedValue(() => liquid(level.value, time.value, 0));
  const backSurface = useDerivedValue(() => liquid(Math.min(1, level.value + 0.025), time.value, 2.1));
  const percent = Math.floor(Math.min(1, progress) * 100);

  return (
    <Canvas
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={full ? 'The red panda is full: goal reached!' : `The red panda is ${percent}% full`}>
      <Group transform={[{ scale: size / 240 }]}>
        {full ? (
          <PandaSilhouette color={theme.water} rings={theme.waterRing} time={time} cheering={celebrating} />
        ) : (
          <>
            <PandaSilhouette color={theme.silhouette} rings={theme.silhouetteRing} time={time} cheering={false} />
            <Group clip={backSurface}>
              <PandaSilhouette color={theme.waterSoft} time={time} cheering={false} />
            </Group>
            <Group clip={surface}>
              <PandaSilhouette color={theme.water} rings={theme.waterRing} time={time} cheering={false} />
            </Group>
          </>
        )}
      </Group>
    </Canvas>
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

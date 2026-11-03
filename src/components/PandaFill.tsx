import { Canvas, Group, Skia, type SkPath } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { Easing, SensorType, useAnimatedSensor, useDerivedValue, useFrameCallback, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { PandaSilhouette } from '@/art/skia/PandaSilhouette';
import { sloshStep, STILL, surfaceSlope, type Slosh } from '@/art/skia/slosh';
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

  const slosh = useTilt(animated);
  const surface = useDerivedValue(() => liquid(level.value, time.value, 0, slosh.value));
  const backSurface = useDerivedValue(() => liquid(Math.min(1, level.value + 0.025), time.value, 2.1, slosh.value));
  const percent = Math.floor(Math.min(1, progress) * 100);

  return (
    <Canvas
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={full ? 'The red panda is full: goal reached!' : `The red panda is ${percent}% full`}>
      <Group transform={[{ scale: size / 240 }]}>
        {full ? (
          <PandaSilhouette color={theme.blue.light} rings={theme.ring} time={time} cheering={celebrating} />
        ) : (
          <>
            <PandaSilhouette color={theme.silhouette} rings={theme.silhouetteRing} time={time} cheering={false} />
            <Group clip={backSurface}>
              <PandaSilhouette color={theme.blue.soft} time={time} cheering={false} />
            </Group>
            <Group clip={surface}>
              <PandaSilhouette color={theme.blue.light} rings={theme.ring} time={time} cheering={false} />
            </Group>
          </>
        )}
      </Group>
    </Canvas>
  );
}

/** The water stays level with the world as the phone tilts, sloshing a little before it settles. */
function useTilt(animated: boolean) {
  const reduceMotion = useReducedMotion();
  const live = animated && !reduceMotion;
  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: 'auto' });
  const slosh = useSharedValue<Slosh>(STILL);
  useFrameCallback((frame) => {
    const g = gravity.sensor.value;
    const target = live ? surfaceSlope(g.x, g.y) : 0;
    slosh.value = sloshStep(slosh.value, target, (frame.timeSincePreviousFrame ?? 16) / 1000);
  });
  return slosh;
}

/** Everything below a gently rolling surface that leans with the phone; the water calms down near empty and full. */
function liquid(level: number, t: number, phase: number, slosh: Slosh): SkPath {
  'worklet';
  const y = BOTTOM - level * (BOTTOM - TOP);
  const room = Math.min(1, level * 8, (1 - level) * 8);
  const amplitude = 4 * room * (1 + 2.5 * slosh.energy);
  const lean = slosh.slope * Math.min(1, level * 4, (1 - level) * 4);
  const path = Skia.PathBuilder.Make();
  path.moveTo(-10, y + lean * -130);
  for (let x = -10; x <= 250; x += 10) {
    const waves = Math.sin(x * 0.045 + t * 2.4 + phase) + 0.5 * Math.sin(x * 0.09 - t * 1.7 + phase);
    path.lineTo(x, y + lean * (x - 120) + amplitude * waves);
  }
  path.lineTo(250, 260);
  path.lineTo(-10, 260);
  path.close();
  return path.build();
}

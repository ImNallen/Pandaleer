import { Canvas, Group, Skia, type SkPath } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { Easing, SensorType, useAnimatedSensor, useDerivedValue, useFrameCallback, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { PANDA_BOUNDS, RedPanda, usePandaImage } from '@/art/skia/RedPanda';
import { poseForProgress, type PandaPose } from '@/art/skia/pandaPose';
import { sloshStep, STILL, surfaceSlope, type Slosh } from '@/art/skia/slosh';
import { useSceneClock } from '@/art/skia/useSceneClock';
import { useTheme, type Theme } from '@/ui/tokens';

const TOP = PANDA_BOUNDS.top;
const BOTTOM = PANDA_BOUNDS.bottom;

type Props = { progress: number; size: number; animated?: boolean; onPoseReady?: (pose: PandaPose) => void };

export function PandaFill({ progress, size, animated = true, onPoseReady }: Props) {
  const theme = useTheme();
  const pose = poseForProgress(progress);
  const time = useSceneClock(animated);
  const level = useSharedValue(0);
  const full = progress >= 1;
  useEffect(() => {
    level.value = withTiming(Math.min(1, progress), { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [progress, level]);

  const slosh = useTilt(animated);
  const surface = useDerivedValue(() => liquid(level.value, time.value, 0, slosh.value));
  const backSurface = useDerivedValue(() => liquid(level.value <= 0 ? 0 : Math.min(1, level.value + 0.025), time.value, 2.1, slosh.value));
  const percent = Math.floor(Math.min(1, progress) * 100);

  return (
    <Canvas
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={full ? 'The red panda is full: goal reached!' : `The red panda is ${percent}% full`}>
      <Group transform={[{ scale: size / 240 }]}>
        <FillArtwork key={pose} pose={pose} theme={theme} full={full} surface={surface} backSurface={backSurface} onPoseReady={onPoseReady} />
      </Group>
    </Canvas>
  );
}

type ArtworkProps = {
  pose: PandaPose;
  theme: Theme;
  full: boolean;
  surface: SharedValue<SkPath>;
  backSurface: SharedValue<SkPath>;
  onPoseReady?: (pose: PandaPose) => void;
};

function FillArtwork({ pose, theme, full, surface, backSurface, onPoseReady }: ArtworkProps) {
  const image = usePandaImage(pose);
  useEffect(() => {
    if (image) onPoseReady?.(pose);
  }, [image, onPoseReady, pose]);

  if (full) return <RedPanda image={image} pose={pose} theme={theme} tone="natural" />;
  return (
    <>
      <RedPanda image={image} pose={pose} theme={theme} tone="empty" />
      <Group clip={backSurface}>
        <RedPanda image={image} pose={pose} theme={theme} tone="back" />
      </Group>
      <Group clip={surface}>
        <RedPanda image={image} pose={pose} theme={theme} tone="water" />
      </Group>
    </>
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
  const y = level <= 0 ? 260 : BOTTOM - level * (BOTTOM - TOP);
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

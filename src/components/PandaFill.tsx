import { Canvas, ColorMatrix, Group, Paint, Skia, type SkPath } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { PandaScene, type PandaMood, type PandaStyle } from '@/art/skia/PandaScene';
import { useSceneClock } from '@/art/skia/useSceneClock';
import { useTheme } from '@/ui/tokens';

/** The panda spans from the button on its hat to the soles of its feet. */
const TOP = 26;
const BOTTOM = 212;

type Props = { progress: number; size: number; celebrating: boolean; look?: PandaStyle; animated?: boolean };

/** A grey silhouette of the panda that fills with colour, like liquid, as the day's steps add up. Both layers share one clock, so the panda keeps moving while it fills. */
export function PandaFill({ progress, size, celebrating, look = 'soft', animated = true }: Props) {
  const theme = useTheme();
  const time = useSceneClock(animated);
  const level = useSharedValue(0);
  const full = progress >= 1;
  const mood: PandaMood = full ? (celebrating ? 'cheer' : 'proud') : 'idle';

  useEffect(() => {
    level.value = withTiming(Math.min(1, progress), { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [progress, level]);

  const surface = useDerivedValue(() => liquid(level.value, time.value));
  const grey = useMemo(() => silhouetteMatrix(theme.silhouette, theme.silhouetteDeep), [theme.silhouette, theme.silhouetteDeep]);
  const scale = size / 240;
  const percent = Math.floor(Math.min(1, progress) * 100);

  return (
    <Canvas
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={full ? 'The red panda is full of colour: goal reached!' : `The red panda is ${percent}% filled with colour`}>
      <Group transform={[{ scale }]}>
        {full ? (
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

/** Everything below a gently rolling surface; the waves calm down near empty and full. */
function liquid(level: number, t: number): SkPath {
  'worklet';
  const y = BOTTOM - level * (BOTTOM - TOP);
  const amplitude = 4 * Math.min(1, level * 8, (1 - level) * 8);
  const path = Skia.PathBuilder.Make();
  path.moveTo(-10, y);
  for (let x = -10; x <= 250; x += 10) {
    path.lineTo(x, y + amplitude * (Math.sin(x * 0.045 + t * 2.4) + 0.5 * Math.sin(x * 0.09 - t * 1.7)));
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

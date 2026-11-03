import { useEffect, useMemo } from 'react';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { ClipPath, Defs, G, Path, Svg } from 'react-native-svg';

import { useArtClock, useSvgId } from '@/art/motion';
import { PandaArt, type PandaPose } from '@/art/panda/Panda';
import { ArtPaletteScope, useTheme, type ArtPalette } from '@/ui/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Art colours that draw details (eyes, ear centres, tail rings, hat band) and stay faintly visible in the silhouette. */
const DEEP_TONES = new Set(['rustDeep', 'brownSoft', 'brown', 'eye', 'khakiDeep', 'leatherDeep', 'leather']);

/** The standing panda spans from the tip of its hat to the soles of its feet. */
const TOP = 24;
const BOTTOM = 212;

type Props = { progress: number; size: number; celebrating: boolean };

/** A grey silhouette of the panda that fills with colour, like liquid, as the day's steps add up. */
export function PandaFill({ progress, size, celebrating }: Props) {
  const theme = useTheme();
  const clipId = useSvgId('fill');
  const time = useArtClock(true);
  const level = useSharedValue(0);
  const full = progress >= 1;

  useEffect(() => {
    level.value = withTiming(Math.min(1, progress), { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [progress, level]);

  const surface = useAnimatedProps(() => ({ d: liquid(level.value, time.value) }));

  const silhouette = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(theme.art).map((key) => [key, DEEP_TONES.has(key) ? theme.silhouetteDeep : theme.silhouette]),
      ) as ArtPalette,
    [theme.art, theme.silhouette, theme.silhouetteDeep],
  );
  const pose: PandaPose = full ? (celebrating ? 'celebrating' : 'flag') : 'standing';
  const percent = Math.floor(Math.min(1, progress) * 100);

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      accessibilityRole="image"
      accessibilityLabel={full ? 'The red panda is full of colour: goal reached!' : `The red panda is ${percent}% filled with colour`}>
      {full ? (
        <PandaArt pose={pose} animated />
      ) : (
        <>
          <Defs>
            <ClipPath id={clipId}>
              <AnimatedPath animatedProps={surface} />
            </ClipPath>
          </Defs>
          <ArtPaletteScope value={silhouette}>
            <PandaArt pose="standing" />
          </ArtPaletteScope>
          <G clipPath={`url(#${clipId})`}>
            <PandaArt pose="standing" animated />
          </G>
        </>
      )}
    </Svg>
  );
}

/** Everything below a gently rolling surface; the waves calm down near empty and full. */
function liquid(level: number, t: number): string {
  'worklet';
  const y = BOTTOM - level * (BOTTOM - TOP);
  const amplitude = 4 * Math.min(1, level * 8, (1 - level) * 8);
  let d = `M -10 ${y.toFixed(1)}`;
  for (let x = -10; x <= 250; x += 10) {
    const wave = Math.sin(x * 0.045 + t * 2.4) + 0.5 * Math.sin(x * 0.09 - t * 1.7);
    d += ` L ${x} ${(y + amplitude * wave).toFixed(1)}`;
  }
  return `${d} L 250 260 L -10 260 Z`;
}

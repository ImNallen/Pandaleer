import { ColorMatrix, Image, useImage, type SkImage } from '@shopify/react-native-skia';

import type { Theme } from '@/ui/tokens';

import type { PandaPose } from './pandaPose';

export type PandaTone = 'natural' | 'empty' | 'water' | 'back';

export const PANDA_BOUNDS = { top: 12, bottom: 224 };

type Layout = { x: number; y: number; width: number; height: number };
type Artwork = { source: number; layout: Layout };

function layoutForBounds(x: number, y: number, width: number, height: number): Layout {
  const scale = (PANDA_BOUNDS.bottom - PANDA_BOUNDS.top) / height;
  return {
    x: 120 - (x + width / 2) * scale,
    y: PANDA_BOUNDS.top - y * scale,
    width: 1254 * scale,
    height: 1254 * scale,
  };
}

const ARTWORK = {
  wave: { source: require('../../../assets/mascot/red-panda-concept-v1.webp'), layout: { x: 20, y: 12, width: 200, height: 212 } },
  walk: { source: require('../../../assets/mascot/red-panda-walking.webp'), layout: layoutForBounds(104, 58, 952, 1124) },
  brisk: { source: require('../../../assets/mascot/red-panda-brisk.webp'), layout: layoutForBounds(54, 56, 1078, 1124) },
  celebrate: { source: require('../../../assets/mascot/red-panda-celebration.webp'), layout: layoutForBounds(80, 44, 1056, 1156) },
} satisfies Record<PandaPose, Artwork>;

type RGB = [number, number, number];

function toneMatrix(shadow: RGB, highlight: RGB): number[] {
  return shadow.flatMap((offset, channel) => {
    const range = highlight[channel] - offset;
    return [0.2126 * range, 0.7152 * range, 0.0722 * range, 0, offset];
  }).concat([0, 0, 0, 1, 0]);
}

const TONES = {
  light: {
    empty: toneMatrix([0.36, 0.38, 0.43], [0.94, 0.95, 0.97]),
    water: toneMatrix([0.035, 0.19, 0.34], [0.65, 0.89, 1]),
    back: toneMatrix([0.16, 0.37, 0.58], [0.84, 0.95, 1]),
  },
  dark: {
    empty: toneMatrix([0.16, 0.18, 0.23], [0.53, 0.57, 0.65]),
    water: toneMatrix([0.035, 0.16, 0.33], [0.61, 0.85, 1]),
    back: toneMatrix([0.09, 0.28, 0.5], [0.75, 0.92, 1]),
  },
};

export function usePandaImage(pose: PandaPose) {
  return useImage(ARTWORK[pose].source);
}

type Props = { image: SkImage | null; pose: PandaPose; theme: Theme; tone?: PandaTone };

export function RedPanda({ image, pose, theme, tone = 'natural' }: Props) {
  return (
    <Image image={image} {...ARTWORK[pose].layout} fit="contain">
      {tone !== 'natural' && <ColorMatrix matrix={TONES[theme.scheme][tone]} />}
    </Image>
  );
}

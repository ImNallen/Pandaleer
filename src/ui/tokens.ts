import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

/** Art colors. Each shape uses at most its base and one deeper tone. */
const lightArt = {
  rust: '#C4532A',
  rustDeep: '#9A3B1C',
  orange: '#E8823F',
  cream: '#FFF3DF',
  creamDeep: '#EFDABA',
  face: '#FFFFFF',
  brown: '#3A2318',
  brownSoft: '#55331F',
  bamboo: '#6CA453',
  bambooDeep: '#4D8340',
  mist: '#8EA8C3',
  mistDeep: '#6D88A6',
  snow: '#FBFCFF',
  fire: '#F6C343',
  fireDeep: '#E8962C',
  khaki: '#DDBE86',
  khakiDeep: '#BE9A5E',
  leather: '#A9663A',
  leatherDeep: '#844A2A',
  blush: '#F2998C',
  eye: '#2B1A12',
  shine: '#FFFFFF',
  /** A soft line around the whole panda so white fur still reads on a white page. */
  halo: '#EADFD5',
};

export type ArtPalette = typeof lightArt;

/** Dark brown limbs and ear centres vanish on dark surfaces, so they lift a step in dark mode. */
const darkArt: ArtPalette = {
  ...lightArt,
  brownSoft: '#7A4A2E',
  leatherDeep: '#9A5A35',
  halo: '#2A221E',
};

export type Theme = {
  scheme: 'light' | 'dark';
  background: string;
  /** Buttons, chips and empty states that sit on the background. */
  fill: string;
  hairline: string;
  text: string;
  textMuted: string;
  /** The streak badge and today's ring. */
  blue: string;
  /** A met goal: week circles and chart bars. */
  orange: string;
  orangeSoft: string;
  /** Today's step count. Bright but still 3:1 on the background for large text. */
  sky: string;
  /** The week card and its empty day capsules. */
  weekCard: string;
  weekTrack: string;
  /** The day-by-hour card and its bars. */
  dayCard: string;
  green: string;
  greenSoft: string;
  /** The silhouette panda's water: the front wave and the lighter wave behind it. */
  water: string;
  waterSoft: string;
  /** Tone-on-tone tail rings on the water and on the empty silhouette. */
  waterRing: string;
  silhouetteRing: string;
  /** The unfilled panda, with a second tone where the art uses its deeper colours. */
  silhouette: string;
  silhouetteDeep: string;
  shadow: string;
  art: ArtPalette;
};

export const themes: Record<Theme['scheme'], Theme> = {
  light: {
    scheme: 'light',
    background: '#FFFFFF',
    fill: '#F3F3F6',
    hairline: '#E6E6EB',
    text: '#17171C',
    textMuted: '#8A8A93',
    blue: '#2E7BFF',
    orange: '#FF6A1F',
    orangeSoft: '#FFD8C2',
    sky: '#1E90FF',
    water: '#5DB3FF',
    waterSoft: '#B5DCFF',
    waterRing: '#45A3F5',
    silhouetteRing: '#E1E1E8',
    weekCard: '#FFF4EC',
    weekTrack: '#FFE3D1',
    dayCard: '#EAF8EE',
    green: '#2DBE60',
    greenSoft: '#C9EED5',
    silhouette: '#EEEEF2',
    silhouetteDeep: '#E0E0E7',
    shadow: '#1B1B3A',
    art: lightArt,
  },
  dark: {
    scheme: 'dark',
    background: '#0E0E11',
    fill: '#1E1E24',
    hairline: '#2C2C33',
    text: '#F5F5F7',
    textMuted: '#9A9AA3',
    blue: '#4C8DFF',
    orange: '#FF7A33',
    orangeSoft: '#5A2E1A',
    sky: '#5AB0FF',
    water: '#4C9BFF',
    waterSoft: '#28507F',
    waterRing: '#3A86E6',
    silhouetteRing: '#2D2D35',
    weekCard: '#211915',
    weekTrack: '#3A2A20',
    dayCard: '#14231A',
    green: '#3DD675',
    greenSoft: '#24412E',
    silhouette: '#24242B',
    silhouetteDeep: '#2F2F38',
    shadow: '#000000',
    art: darkArt,
  },
};

const SchemeOverride = createContext<Theme['scheme'] | null>(null);

/** Forces a color scheme for a subtree, e.g. to show light and dark side by side in the Art Gallery. */
export const SchemeScope = SchemeOverride.Provider;

export function useTheme(): Theme {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  return themes[useContext(SchemeOverride) ?? system];
}

const ArtOverride = createContext<ArtPalette | null>(null);

/** Repaints every illustration in a subtree, e.g. one flat colour for a silhouette. */
export const ArtPaletteScope = ArtOverride.Provider;

export function useArt(): ArtPalette {
  const theme = useTheme();
  return useContext(ArtOverride) ?? theme.art;
}

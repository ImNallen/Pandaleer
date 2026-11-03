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
  pine: '#3F7346',
  stone: '#C2B7A5',
  stoneDeep: '#A3967F',
  ridge: '#B7C8DA',
  ridgeDeep: '#9DB2C8',
  night: '#1B2440',
  trail: '#F0DDB4',
  groundBamboo: '#C8E0A2',
  groundMeadow: '#D9E8AC',
  groundForest: '#B4D49B',
  groundRock: '#DFD5C4',
  groundSnow: '#EEF3F8',
};

export type ArtPalette = typeof lightArt;

/** Dark brown limbs and ear centres vanish on dark surfaces, so they lift a step in dark mode. */
const darkArt: ArtPalette = {
  ...lightArt,
  brownSoft: '#7A4A2E',
  leatherDeep: '#9A5A35',
};

export type Theme = {
  scheme: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  accent: string;
  track: string;
  shadow: string;
  art: ArtPalette;
};

export const themes: Record<Theme['scheme'], Theme> = {
  light: {
    scheme: 'light',
    background: '#FFF6E9',
    surface: '#FBEBD5',
    surfaceRaised: '#F5DFC2',
    text: lightArt.brown,
    textMuted: '#7A5A48',
    accent: lightArt.rust,
    track: '#F0DEC4',
    shadow: '#7A4A2A',
    art: lightArt,
  },
  dark: {
    scheme: 'dark',
    background: '#1D1511',
    surface: '#2A1F19',
    surfaceRaised: '#372821',
    text: '#F8EBDC',
    textMuted: '#C4A893',
    accent: lightArt.orange,
    track: '#45332A',
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

export function useArt(): ArtPalette {
  return useTheme().art;
}

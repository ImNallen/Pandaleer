import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

/**
 * Two four-step scales carry the whole app: blue for the panda, the streak and the week,
 * and the same steps in green for the day card.
 */
type Scale = {
  /** Card backgrounds. */
  faint: string;
  /** Empty tracks and the wave behind the water. */
  soft: string;
  /** Fills: the panda's water, week capsules, chart bars. */
  light: string;
  /** Emphasis: the streak, the step count, today, checks. Large text keeps 3:1 on the background. */
  strong: string;
};

export type Theme = {
  scheme: 'light' | 'dark';
  background: string;
  /** Buttons and chips that sit on the background. */
  fill: string;
  hairline: string;
  text: string;
  textMuted: string;
  blue: Scale;
  green: Scale;
  /** Tone-on-tone tail rings on the water. */
  ring: string;
  /** The unfilled panda and its tail rings. */
  silhouette: string;
  silhouetteRing: string;
};

export const themes: Record<Theme['scheme'], Theme> = {
  light: {
    scheme: 'light',
    background: '#FFFFFF',
    fill: '#F3F3F6',
    hairline: '#E6E6EB',
    text: '#17171C',
    textMuted: '#8A8A93',
    blue: { faint: '#F0F7FF', soft: '#C9E3FF', light: '#5DB3FF', strong: '#1E88F2' },
    green: { faint: '#EFFAF2', soft: '#C6EED4', light: '#5FCF86', strong: '#1FAE57' },
    ring: '#45A3F5',
    silhouette: '#EEEEF2',
    silhouetteRing: '#E1E1E8',
  },
  dark: {
    scheme: 'dark',
    background: '#0E0E11',
    fill: '#1E1E24',
    hairline: '#2C2C33',
    text: '#F5F5F7',
    textMuted: '#9A9AA3',
    blue: { faint: '#0F1B2A', soft: '#1E3A5C', light: '#4C9BFF', strong: '#2F80ED' },
    green: { faint: '#0F2016', soft: '#1F4A30', light: '#3DCB72', strong: '#22B35E' },
    ring: '#3A86E6',
    silhouette: '#24242B',
    silhouetteRing: '#2D2D35',
  },
};

const SchemeOverride = createContext<Theme['scheme'] | null>(null);

/** Forces a color scheme for a subtree, e.g. to show light and dark side by side in the Art Gallery. */
export const SchemeScope = SchemeOverride.Provider;

export function useTheme(): Theme {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  return themes[useContext(SchemeOverride) ?? system];
}

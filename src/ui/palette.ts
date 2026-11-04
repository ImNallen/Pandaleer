/**
 * Two four-step scales carry the whole app: blue for the panda, the streak and the week,
 * and the same steps in green for the day card.
 */
type Scale = {
  /** Card backgrounds. */
  faint: string;
  /** Empty tracks. */
  soft: string;
  /** Fills: the streak disc, part-filled capsules, past chart bars. */
  light: string;
  /** Emphasis: the step count, today, goals met, buttons. Stays 3:1 on `soft`. */
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
  /** Tappable text, which unlike the fills must hold 4.5:1 on every surface. */
  link: string;
  /** Text and icons on `blue.strong`. */
  onStrong: string;
  /** Text on `blue.light`, which stays bright enough for dark ink in both schemes. */
  onLight: string;
  blue: Scale;
  green: Scale;
};

const INK = '#17171C';
const WHITE = '#FFFFFF';

export const themes: Record<Theme['scheme'], Theme> = {
  light: {
    scheme: 'light',
    background: WHITE,
    fill: '#F3F3F6',
    hairline: '#E6E6EB',
    text: INK,
    textMuted: '#6E6E76',
    link: '#1469CC',
    onStrong: WHITE,
    onLight: INK,
    blue: { faint: '#F0F7FF', soft: '#C9E3FF', light: '#5DB3FF', strong: '#1672DB' },
    green: { faint: '#EFFAF2', soft: '#C6EED4', light: '#2A9E58', strong: '#0F7A3C' },
  },
  dark: {
    scheme: 'dark',
    background: '#0E0E11',
    fill: '#1E1E24',
    hairline: '#2C2C33',
    text: '#F5F5F7',
    textMuted: '#9A9AA3',
    link: '#6FB1FF',
    onStrong: WHITE,
    onLight: INK,
    blue: { faint: '#0F1B2A', soft: '#172E47', light: '#4C9BFF', strong: '#2A73DF' },
    green: { faint: '#0F2016', soft: '#1F4A30', light: '#3DCB72', strong: '#22B35E' },
  },
};

/** What the Increase Contrast setting swaps in. */
export const highContrastThemes: Record<Theme['scheme'], Theme> = {
  light: {
    ...themes.light,
    hairline: '#B8B8C0',
    textMuted: '#55555C',
    link: '#0F5FBD',
    blue: { faint: '#F0F7FF', soft: '#D9EBFF', light: '#2F86E0', strong: '#0F5FBD' },
    green: { faint: '#EFFAF2', soft: '#C6EED4', light: '#1F8A4A', strong: '#0B5F2E' },
  },
  dark: {
    ...themes.dark,
    fill: '#2A2A31',
    hairline: '#55555E',
    textMuted: '#C4C4CC',
    link: '#8FC3FF',
    blue: { faint: '#0F1B2A', soft: '#122238', light: '#6BB0FF', strong: '#2A73DF' },
    green: { faint: '#0F2016', soft: '#1F4A30', light: '#56DB8A', strong: '#3DCB72' },
  },
};

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { highContrastThemes, themes, type Theme } from './palette.ts';

function luminance(hex: string): number {
  const value = parseInt(hex.slice(1), 16);
  const [r, g, b] = [value >> 16, (value >> 8) & 255, value & 255].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT = 4.5;
const GRAPHIC = 3;

function pairs(theme: Theme): [string, string, string, number][] {
  const surfaces = [theme.background, theme.fill, theme.blue.faint, theme.green.faint];
  return [
    ...surfaces.flatMap((surface): [string, string, string, number][] => [
      ['text', theme.text, surface, TEXT],
      ['muted text', theme.textMuted, surface, TEXT],
      ['link', theme.link, surface, TEXT],
    ]),
    ['streak number', theme.onLight, theme.blue.light, TEXT],
    ['button label', theme.onStrong, theme.blue.strong, TEXT],
    ['step count (large text)', theme.blue.strong, theme.background, GRAPHIC],
    ['fill on track', theme.blue.strong, theme.blue.soft, GRAPHIC],
    ['today ring', theme.blue.strong, theme.blue.faint, GRAPHIC],
    ['selected ring', theme.text, theme.blue.faint, GRAPHIC],
    ['past bars', theme.green.light, theme.green.faint, GRAPHIC],
    ['current bar', theme.green.strong, theme.green.faint, GRAPHIC],
  ];
}

const ALL = [
  ['light', themes.light],
  ['dark', themes.dark],
  ['light, Increase Contrast', highContrastThemes.light],
  ['dark, Increase Contrast', highContrastThemes.dark],
] as const;

describe('theme contrast', () => {
  for (const [name, theme] of ALL) {
    for (const [role, foreground, background, minimum] of pairs(theme)) {
      it(`${name}: ${role} (${foreground} on ${background})`, () => {
        const ratio = contrast(foreground, background);
        assert.ok(ratio >= minimum, `${ratio.toFixed(2)}:1 is below ${minimum}:1`);
      });
    }
  }

  it('Increase Contrast raises muted text past 7:1 on the background', () => {
    for (const theme of Object.values(highContrastThemes)) {
      assert.ok(contrast(theme.textMuted, theme.background) >= 7);
    }
  });
});

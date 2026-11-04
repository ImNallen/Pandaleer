import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from './tokens';

type Role = { style: TextStyle; ramp: NonNullable<TextProps['dynamicTypeRamp']>; cap?: number };

/**
 * Each role follows one Dynamic Type ramp, so large sizes grow the way system text does.
 * The caps keep one-screen Home in balance: the step count stays its largest text.
 */
const ROLES = {
  hero: { style: { fontSize: 40, fontWeight: '800', letterSpacing: -0.8, fontVariant: ['tabular-nums'] }, ramp: 'largeTitle', cap: 1.3 },
  title: { style: { fontSize: 28, fontWeight: '800' }, ramp: 'title1' },
  heading: { style: { fontSize: 16, fontWeight: '700' }, ramp: 'headline', cap: 2 },
  body: { style: { fontSize: 17, fontWeight: '500' }, ramp: 'body' },
  label: { style: { fontSize: 15, fontWeight: '600' }, ramp: 'subheadline', cap: 2 },
  detail: { style: { fontSize: 14, fontWeight: '600' }, ramp: 'footnote', cap: 2 },
  caption: { style: { fontSize: 13, fontWeight: '700' }, ramp: 'caption1', cap: 1.4 },
} satisfies Record<string, Role>;

export type TextVariant = keyof typeof ROLES;

type Props = TextProps & { variant?: TextVariant; muted?: boolean };

/** SF Pro Rounded everywhere, scaled by Dynamic Type. */
export function Text({ variant = 'body', muted = false, style, ...rest }: Props) {
  const theme = useTheme();
  const role: Role = ROLES[variant];
  return (
    <RNText
      dynamicTypeRamp={role.ramp}
      maxFontSizeMultiplier={role.cap}
      {...rest}
      style={[{ fontFamily: 'ui-rounded', color: muted ? theme.textMuted : theme.text }, role.style, style]}
    />
  );
}

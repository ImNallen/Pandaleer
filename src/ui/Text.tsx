import { Text as RNText, type TextProps } from 'react-native';

import { useTheme } from './tokens';

const VARIANTS = {
  display: { fontSize: 56, fontWeight: '800', letterSpacing: -1 },
  title: { fontSize: 30, fontWeight: '800' },
  heading: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 17, fontWeight: '500' },
  caption: { fontSize: 14, fontWeight: '600' },
} as const;

export type TextVariant = keyof typeof VARIANTS;

type Props = TextProps & { variant?: TextVariant; muted?: boolean };

/** SF Pro Rounded everywhere, scaled by Dynamic Type. */
export function Text({ variant = 'body', muted = false, style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <RNText
      {...rest}
      style={[{ fontFamily: 'ui-rounded', color: muted ? theme.textMuted : theme.text }, VARIANTS[variant], style]}
    />
  );
}

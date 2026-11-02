import { View, type ViewProps } from 'react-native';

import { useTheme } from './tokens';

export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: theme.surface,
          borderRadius: 24,
          padding: 16,
          shadowColor: theme.shadow,
          shadowOpacity: theme.scheme === 'light' ? 0.1 : 0.35,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
        },
        style,
      ]}
    />
  );
}

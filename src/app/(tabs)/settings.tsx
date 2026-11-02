import { StyleSheet, View } from 'react-native';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

export default function Placeholder() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text muted>Settings are being packed. Back soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 } });

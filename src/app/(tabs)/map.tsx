import { StyleSheet, View } from 'react-native';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

export default function DaysMap() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text muted>I’m redrawing the map as a trail of our days. Back soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 } });

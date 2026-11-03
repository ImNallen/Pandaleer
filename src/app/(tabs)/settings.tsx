import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

export default function Settings() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text muted>Settings are being packed. Back soon!</Text>
      {__DEV__ && (
        <View style={styles.dev}>
          <Link href="/dev/steps">
            <Text variant="caption" style={{ color: theme.accent }}>
              Mock steps
            </Text>
          </Link>
          <Link href="/dev/gallery">
            <Text variant="caption" style={{ color: theme.accent }}>
              Art Gallery
            </Text>
          </Link>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 },
  dev: { flexDirection: 'row', gap: 20 },
});

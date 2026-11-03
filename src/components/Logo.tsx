import { Canvas, Group } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import { RedPanda, usePandaImage } from '@/art/skia/RedPanda';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

export function Logo({ size }: { size: number }) {
  const theme = useTheme();
  const image = usePandaImage('wave');
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel="Pandaleer">
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale: size / 240 }]}>
          <RedPanda image={image} theme={theme} pose="wave" />
        </Group>
      </Canvas>
      <Text style={[styles.word, { fontSize: size * 0.3, color: theme.text }]}>Pandaleer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  word: { fontWeight: '800', letterSpacing: -0.5 },
});

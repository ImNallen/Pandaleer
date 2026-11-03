import { Canvas, Group } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import { RED_PANDA, RedPanda, type PandaMotion } from '@/art/skia/RedPanda';
import { useSceneClock } from '@/art/skia/useSceneClock';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

/** The colour panda, walking by default, beside the Pandaleer wordmark. */
export function Logo({ size, motion = 'walk', animated = true }: { size: number; motion?: PandaMotion; animated?: boolean }) {
  const theme = useTheme();
  const time = useSceneClock(animated);
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel="Pandaleer">
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale: size / 240 }]}>
          <RedPanda colors={RED_PANDA} motion={motion} time={time} />
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

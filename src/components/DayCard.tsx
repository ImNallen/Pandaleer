import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

const BAR_HEIGHT = 56;
/** Two hours per bar keeps the day readable at a glance. */
const HOURS_PER_BAR = 2;
const LABELS = [
  { bar: 3, text: '6 AM' },
  { bar: 6, text: '12 PM' },
  { bar: 9, text: '6 PM' },
] as const;

/** When today's walking happened. */
export function DayCard({ hours, currentHour }: { hours: readonly number[]; currentHour: number }) {
  const theme = useTheme();
  const bars = Array.from({ length: 24 / HOURS_PER_BAR }, (_, i) => hours.slice(i * HOURS_PER_BAR, (i + 1) * HOURS_PER_BAR).reduce((a, b) => a + b, 0));
  const currentBar = Math.floor(currentHour / HOURS_PER_BAR);
  const peak = Math.max(...bars, 1);
  const busiest = bars.indexOf(Math.max(...bars));

  return (
    <View
      style={[styles.card, { backgroundColor: theme.dayCard }]}
      accessible
      accessibilityLabel={bars[busiest] > 0 ? `Your day: you walked most around ${hourName(busiest * HOURS_PER_BAR)}.` : 'Your day: no steps yet.'}>
      <Text style={styles.title}>Your day</Text>
      <View style={styles.bars}>
        {bars.map((steps, i) => (
          <Bar key={i} index={i} share={i > currentBar ? 0 : steps / peak} current={i === currentBar} />
        ))}
      </View>
      <View style={styles.labels}>
        {LABELS.map(({ bar, text }) => (
          <Text key={text} muted style={[styles.label, { left: `${(bar / bars.length) * 100}%` }]} maxFontSizeMultiplier={1.3}>
            {text}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Bar({ index, share, current }: { index: number; share: number; current: boolean }) {
  const theme = useTheme();
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.value = withDelay(200 + index * 40, withTiming(share, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [share, index, grow]);

  const style = useAnimatedStyle(() => ({ height: Math.max(6, grow.value * BAR_HEIGHT) }));
  return (
    <View style={styles.slot}>
      <Animated.View style={[styles.bar, { backgroundColor: current || share > 0 ? theme.green : theme.greenSoft, opacity: current || share === 0 ? 1 : 0.75 }, style]} />
    </View>
  );
}

function hourName(hour: number): string {
  return new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: 'numeric' });
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, gap: 10 },
  title: { fontSize: 16, fontWeight: '700' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: BAR_HEIGHT },
  slot: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  bar: { borderRadius: 6 },
  labels: { height: 16 },
  label: { position: 'absolute', fontSize: 12, fontWeight: '600', transform: [{ translateX: -14 }] },
});

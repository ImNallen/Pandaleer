import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

const BAR_HEIGHT = 56;
/** Two hours per bar keeps the day readable at a glance. */
const HOURS_PER_BAR = 2;
/** 6:00, noon and 18:00, written the way this device writes times. */
const LABEL_HOURS = [6, 12, 18];
const LABEL_WIDTH = 80;

/** When today's walking happened. */
export function DayCard({ hours, currentHour }: { hours: readonly number[]; currentHour: number }) {
  const theme = useTheme();
  const bars = Array.from({ length: 24 / HOURS_PER_BAR }, (_, i) => hours.slice(i * HOURS_PER_BAR, (i + 1) * HOURS_PER_BAR).reduce((a, b) => a + b, 0));
  const currentBar = Math.floor(currentHour / HOURS_PER_BAR);
  const peak = Math.max(...bars, 1);
  const busiest = bars.indexOf(Math.max(...bars));

  return (
    <View
      style={[styles.card, { backgroundColor: theme.green.faint }]}
      accessible
      accessibilityLabel={bars[busiest] > 0 ? `Your day: you walked most around ${hourName(busiest * HOURS_PER_BAR)}.` : 'Your day: no steps yet.'}>
      <Text variant="heading">Your day</Text>
      <View style={styles.bars}>
        {bars.map((steps, i) => (
          <Bar key={i} index={i} share={i > currentBar ? 0 : steps / peak} current={i === currentBar} />
        ))}
      </View>
      <View style={styles.labels}>
        {LABEL_HOURS.map((hour) => (
          <View key={hour} style={[styles.label, { left: `${(hour / 24) * 100}%` }]}>
            <Text variant="caption" muted numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {hourName(hour)}
            </Text>
          </View>
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
      <Animated.View style={[styles.bar, { backgroundColor: current ? theme.green.strong : share > 0 ? theme.green.light : theme.green.soft }, style]} />
    </View>
  );
}

function hourName(hour: number): string {
  return new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: 'numeric' });
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, gap: 10 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: BAR_HEIGHT },
  slot: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  bar: { borderRadius: 6 },
  labels: { height: 16 },
  label: { position: 'absolute', width: LABEL_WIDTH, marginLeft: -LABEL_WIDTH / 2, alignItems: 'center' },
});

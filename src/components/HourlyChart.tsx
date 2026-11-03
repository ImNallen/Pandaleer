import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

const HEIGHT = 72;
const LABELS = [0, 6, 12, 18] as const;

/** Today's steps per hour, so you can see when the walking happened. */
export function HourlyChart({ hours, currentHour }: { hours: readonly number[]; currentHour: number }) {
  const peak = Math.max(...hours, 1);
  const busiest = hours.indexOf(Math.max(...hours));
  return (
    <View
      accessible
      accessibilityLabel={
        hours.some((h) => h > 0) ? `Steps by hour. Your busiest hour was ${hourName(busiest)} with ${hours[busiest].toLocaleString()} steps.` : 'No steps yet today.'
      }>
      <View style={[styles.bars, { height: HEIGHT }]}>
        {hours.map((steps, hour) => (
          <Bar key={hour} hour={hour} share={hour > currentHour ? 0 : steps / peak} current={hour === currentHour} future={hour > currentHour} />
        ))}
      </View>
      <View style={styles.labels}>
        {LABELS.map((hour) => (
          <Text key={hour} variant="caption" muted style={[styles.label, { left: `${(hour / 24) * 100}%` }]} maxFontSizeMultiplier={1.3}>
            {hourName(hour)}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Bar({ hour, share, current, future }: { hour: number; share: number; current: boolean; future: boolean }) {
  const theme = useTheme();
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.value = withDelay(hour * 18, withTiming(share, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [share, hour, grow]);

  const style = useAnimatedStyle(() => ({ height: Math.max(4, grow.value * HEIGHT) }));
  const color = future ? theme.fill : current ? theme.blue : share > 0 ? theme.orange : theme.fill;

  return (
    <View style={styles.slot}>
      <Animated.View style={[styles.bar, { backgroundColor: color, opacity: share > 0 || future ? 1 : 0.9 }, style]} />
    </View>
  );
}

function hourName(hour: number): string {
  return new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: 'numeric' });
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  slot: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  bar: { borderRadius: 3 },
  labels: { height: 18, marginTop: 6 },
  label: { position: 'absolute', fontSize: 12 },
});

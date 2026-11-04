import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { SymbolView } from 'expo-symbols';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

export function StepCount({ steps, goal }: { steps: number; goal: number }) {
  const theme = useTheme();
  const shown = useCountUp(steps);
  const percent = Math.floor((steps / goal) * 100);
  const remaining = Math.max(0, goal - steps);
  const status = remaining === 0 ? 'Goal reached' : `${remaining.toLocaleString()} steps to go`;
  return (
    <View style={styles.container} accessible accessibilityLabel={`${steps.toLocaleString()} steps today, goal ${goal.toLocaleString()} steps, ${status.toLowerCase()}, ${percent}% of your goal`}>
      <View style={styles.row}>
        <SymbolView name="shoeprints.fill" size={26} tintColor={theme.blue.strong} style={styles.icon} />
        <Text variant="hero" style={{ color: theme.blue.strong }} maxFontSizeMultiplier={1.25}>
          {shown.toLocaleString()}
        </Text>
      </View>
      <Text variant="label" style={styles.centered}>of {goal.toLocaleString()} steps today</Text>
      <Text variant="detail" style={styles.centered}>{status}</Text>
      <Text variant="caption" muted style={styles.centered}>{percent}% of your goal</Text>
    </View>
  );
}

function useCountUp(target: number): number {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    if (reduceMotion) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = from.current;
    const began = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - began) / 700);
      const next = Math.round(start + (target - start) * (1 - (1 - t) ** 3));
      from.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, reduceMotion]);

  return value;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  centered: { textAlign: 'center' },
  icon: { width: 26, height: 26 },
});

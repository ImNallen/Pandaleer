import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { SymbolView } from 'expo-symbols';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

/** Today's steps counting up to new totals, with the share of the goal underneath. */
export function StepCount({ steps, goal }: { steps: number; goal: number }) {
  const theme = useTheme();
  const shown = useCountUp(steps);
  const percent = Math.floor((steps / goal) * 100);
  return (
    <View style={styles.container} accessible accessibilityLabel={`${steps.toLocaleString()} steps, ${percent}% of your goal of ${goal.toLocaleString()}`}>
      <View style={styles.row}>
        <SymbolView name="shoeprints.fill" size={26} tintColor={theme.sky} style={styles.icon} />
        <Text style={[styles.steps, { color: theme.sky }]} maxFontSizeMultiplier={1.25}>
          {shown.toLocaleString()}
        </Text>
      </View>
      <Text style={styles.percent} maxFontSizeMultiplier={1.5}>
        {percent}% of your goal
      </Text>
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
  container: { alignItems: 'center', gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 26, height: 26 },
  steps: { fontSize: 40, fontWeight: '800', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  percent: { fontSize: 15, fontWeight: '600' },
});

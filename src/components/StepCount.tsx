import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Text } from '@/ui/Text';

/** "2,500 Steps" counting up to new totals, with the share of today's goal underneath. */
export function StepCount({ steps, goal }: { steps: number; goal: number }) {
  const shown = useCountUp(steps);
  const percent = Math.floor((steps / goal) * 100);
  return (
    <View style={styles.container} accessible accessibilityLabel={`${steps.toLocaleString()} steps, ${percent}% of your goal of ${goal.toLocaleString()}`}>
      <Text style={styles.steps} maxFontSizeMultiplier={1.25}>
        {shown.toLocaleString()} <Text style={styles.unit}>Steps</Text>
      </Text>
      <Text muted style={styles.percent} maxFontSizeMultiplier={1.5}>
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
  container: { alignItems: 'center', gap: 2 },
  steps: { fontSize: 48, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 28, fontWeight: '700', letterSpacing: 0 },
  percent: { fontSize: 17, fontWeight: '600' },
});

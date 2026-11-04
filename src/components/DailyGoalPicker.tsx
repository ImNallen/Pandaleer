import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

const GOAL = { min: 1000, max: 30000, step: 500 };
/** A held button waits this long, then steps faster and faster down to the quickest pace. */
const HOLD = { delay: 350, first: 220, quickest: 90, speedUp: 0.9 };

type Props = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function DailyGoalPicker({ value: goal, onChange, disabled = false }: Props) {
  const theme = useTheme();
  const latest = useRef({ goal, onChange, disabled });
  useLayoutEffect(() => {
    latest.current = { goal, onChange, disabled };
  }, [goal, onChange, disabled]);

  const change = (delta: number): number | null => {
    const current = latest.current;
    if (current.disabled) return null;
    const next = Math.min(GOAL.max, Math.max(GOAL.min, current.goal + delta));
    if (next === current.goal) return null;
    current.goal = next;
    Haptics.selectionAsync();
    current.onChange(next);
    return next;
  };

  const tap = (delta: number) => {
    const next = change(delta);
    if (next !== null) AccessibilityInfo.announceForAccessibility(`${next.toLocaleString()} steps`);
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.fill }]}>
      <Text variant="label" muted accessibilityElementsHidden>
        Daily goal
      </Text>
      <View style={styles.stepper}>
        <RoundButton symbol="minus" label="Lower goal" disabled={disabled || goal <= GOAL.min} onTap={() => tap(-GOAL.step)} onHoldStep={() => change(-GOAL.step) !== null} />
        <View
          style={styles.goal}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Daily goal"
          accessibilityValue={{ min: GOAL.min, max: GOAL.max, now: goal, text: `${goal.toLocaleString()} steps` }}
          accessibilityState={{ disabled }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'increment') tap(GOAL.step);
            if (event.nativeEvent.actionName === 'decrement') tap(-GOAL.step);
          }}>
          <Text variant="hero" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {goal.toLocaleString()}
          </Text>
        </View>
        <RoundButton symbol="plus" label="Raise goal" disabled={disabled || goal >= GOAL.max} onTap={() => tap(GOAL.step)} onHoldStep={() => change(GOAL.step) !== null} />
      </View>
      <Text variant="detail" muted style={styles.centered}>
        steps a day
      </Text>
    </View>
  );
}

type RoundButtonProps = {
  symbol: 'plus' | 'minus';
  label: string;
  disabled: boolean;
  onTap: () => void;
  /** Returns false when there is nothing left to step to. */
  onHoldStep: () => boolean;
};

function RoundButton({ symbol, label, disabled, onTap, onHoldStep }: RoundButtonProps) {
  const theme = useTheme();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef({ disabled, onHoldStep });
  useLayoutEffect(() => {
    latest.current = { disabled, onHoldStep };
    if (disabled) clearTimeout(timer.current);
  }, [disabled, onHoldStep]);
  const stopHolding = () => clearTimeout(timer.current);

  useEffect(() => () => clearTimeout(timer.current), []);

  const holdFor = (delay: number) => {
    timer.current = setTimeout(() => {
      if (!latest.current.disabled && latest.current.onHoldStep()) holdFor(Math.max(HOLD.quickest, delay * HOLD.speedUp));
    }, delay);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onTap}
      onLongPress={() => {
        if (!latest.current.disabled && latest.current.onHoldStep()) holdFor(HOLD.first);
      }}
      delayLongPress={HOLD.delay}
      onPressOut={stopHolding}
      style={({ pressed }) => [styles.round, { backgroundColor: theme.blue.strong, opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
      <SymbolView name={symbol} size={20} weight="bold" tintColor={theme.onStrong} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 18, gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goal: { flex: 1, alignItems: 'center' },
  centered: { textAlign: 'center' },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});

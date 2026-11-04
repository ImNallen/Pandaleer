import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { goalOn } from '@/game/game';
import { DEFAULT_GOAL, useSettings } from '@/state/settings';
import { stepSource } from '@/steps';
import { useToday } from '@/time/today';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

const GOAL = { min: 1000, max: 30000, step: 500 };
/** A held button waits this long, then steps faster and faster down to the quickest pace. */
const HOLD = { delay: 350, first: 220, quickest: 90, speedUp: 0.9 };

export default function Settings() {
  const theme = useTheme();
  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
      <GoalStepper />
      {stepSource.kind === 'healthkit' && <HealthAccess />}
      {__DEV__ && <DevLinks />}
    </ScrollView>
  );
}

function GoalStepper() {
  const theme = useTheme();
  const today = useToday();
  const goalHistory = useSettings((state) => state.goalHistory);
  const goal = goalHistory ? goalOn(goalHistory, today) : DEFAULT_GOAL;

  /** Reads the store rather than the render, so a held button keeps counting. Returns the new goal, or null at a limit. */
  const change = (delta: number): number | null => {
    const { goalHistory: history, setGoal } = useSettings.getState();
    const current = history ? goalOn(history, today) : DEFAULT_GOAL;
    const next = Math.min(GOAL.max, Math.max(GOAL.min, current + delta));
    if (next === current) return null;
    Haptics.selectionAsync();
    setGoal(today, next);
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
        <RoundButton symbol="minus" label="Lower goal" disabled={goal <= GOAL.min} onTap={() => tap(-GOAL.step)} onHoldStep={() => change(-GOAL.step) !== null} />
        <View
          style={styles.goal}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Daily goal"
          accessibilityValue={{ text: `${goal.toLocaleString()} steps` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => change(event.nativeEvent.actionName === 'increment' ? GOAL.step : -GOAL.step)}>
          <Text variant="hero" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {goal.toLocaleString()}
          </Text>
        </View>
        <RoundButton symbol="plus" label="Raise goal" disabled={goal >= GOAL.max} onTap={() => tap(GOAL.step)} onHoldStep={() => change(GOAL.step) !== null} />
      </View>
      <Text variant="detail" muted style={styles.centered}>
        steps a day · a new goal starts counting today
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
  const stopHolding = () => clearTimeout(timer.current);

  useEffect(() => () => clearTimeout(timer.current), []);

  const holdFor = (delay: number) => {
    timer.current = setTimeout(() => {
      if (onHoldStep()) holdFor(Math.max(HOLD.quickest, delay * HOLD.speedUp));
    }, delay);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onTap}
      onLongPress={() => {
        onHoldStep();
        holdFor(HOLD.first);
      }}
      delayLongPress={HOLD.delay}
      onPressOut={stopHolding}
      style={({ pressed }) => [styles.round, { backgroundColor: theme.blue.strong, opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
      <SymbolView name={symbol} size={20} weight="bold" tintColor={theme.onStrong} />
    </Pressable>
  );
}

/**
 * HealthKit never says when read access was denied, so this stays reachable whatever we were told.
 * iOS may open its Settings anywhere, so the copy names the way there.
 */
function HealthAccess() {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.fill }]}>
      <Text variant="label" muted>
        Apple Health
      </Text>
      <Text>Pandaleer reads your step count from Apple Health. To change that, go to Privacy & Security, then Health, in the Settings app.</Text>
      <Pressable accessibilityRole="link" onPress={() => Linking.openSettings()} style={styles.row}>
        <Text style={[styles.link, { color: theme.link }]}>Open Settings</Text>
      </Pressable>
    </View>
  );
}

function DevLinks() {
  const theme = useTheme();
  const open = (href: Href) => {
    router.dismiss();
    router.push(href);
  };
  return (
    <View style={[styles.card, { backgroundColor: theme.fill }]}>
      <Text variant="label" muted>
        Developer
      </Text>
      {(
        [
          ['Mock steps', '/dev/steps'],
          ['Art Gallery', '/dev/gallery'],
        ] as const
      ).map(([title, href]) => (
        <Pressable key={href} accessibilityRole="button" onPress={() => open(href)} style={styles.row}>
          <Text style={[styles.link, { color: theme.link }]}>{title}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 22, gap: 16 },
  card: { borderRadius: 22, padding: 18, gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goal: { flex: 1, alignItems: 'center' },
  centered: { textAlign: 'center' },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: 44, justifyContent: 'center' },
  link: { fontWeight: '600' },
});

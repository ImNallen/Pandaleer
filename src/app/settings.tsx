import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { goalOn } from '@/game/game';
import { DEFAULT_GOAL, useSettings } from '@/state/settings';
import { useToday } from '@/time/today';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

const GOAL = { min: 1000, max: 30000, step: 500 };

export default function Settings() {
  const theme = useTheme();
  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Settings
      </Text>
      <GoalStepper />
      {__DEV__ && <DevLinks />}
    </ScrollView>
  );
}

function GoalStepper() {
  const theme = useTheme();
  const today = useToday();
  const goalHistory = useSettings((state) => state.goalHistory);
  const setGoal = useSettings((state) => state.setGoal);
  const goal = goalHistory ? goalOn(goalHistory, today) : DEFAULT_GOAL;

  const change = (delta: number) => {
    const next = Math.min(GOAL.max, Math.max(GOAL.min, goal + delta));
    if (next === goal) return;
    Haptics.selectionAsync();
    setGoal(today, next);
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.fill }]}>
      <Text muted style={styles.label}>
        Daily goal
      </Text>
      <View
        style={styles.stepper}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Daily goal"
        accessibilityValue={{ text: `${goal.toLocaleString()} steps` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => change(event.nativeEvent.actionName === 'increment' ? GOAL.step : -GOAL.step)}>
        <RoundButton symbol="minus" label="Lower goal" disabled={goal <= GOAL.min} onPress={() => change(-GOAL.step)} />
        <Text style={styles.goal} maxFontSizeMultiplier={1.3}>
          {goal.toLocaleString()}
        </Text>
        <RoundButton symbol="plus" label="Raise goal" disabled={goal >= GOAL.max} onPress={() => change(GOAL.step)} />
      </View>
      <Text muted style={styles.hint}>
        steps a day · a new goal starts counting today
      </Text>
    </View>
  );
}

function RoundButton({ symbol, label, disabled, onPress }: { symbol: 'plus' | 'minus'; label: string; disabled: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.round, { backgroundColor: theme.orange, opacity: disabled ? 0.35 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
      <SymbolView name={symbol} size={20} weight="bold" tintColor="#FFFFFF" />
    </Pressable>
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
      <Text muted style={styles.label}>
        Developer
      </Text>
      {(
        [
          ['Mock steps', '/dev/steps'],
          ['Art Gallery', '/dev/gallery'],
        ] as const
      ).map(([title, href]) => (
        <Pressable key={href} accessibilityRole="button" onPress={() => open(href)} style={styles.devRow}>
          <Text style={{ color: theme.blue, fontWeight: '600' }}>{title}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 22, gap: 16 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  card: { borderRadius: 22, padding: 18, gap: 8 },
  label: { fontSize: 15, fontWeight: '600' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goal: { fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'] },
  hint: { fontSize: 14, textAlign: 'center' },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  devRow: { paddingVertical: 6 },
});

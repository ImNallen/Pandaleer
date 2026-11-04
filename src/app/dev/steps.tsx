import { Redirect } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { addDays, type LocalDate } from '@/game/date';
import { mockSteps, type MockSimulation } from '@/steps/mock';
import { useDev } from '@/state/dev';
import { useSettings } from '@/state/settings';
import { stepSource } from '@/steps';
import { useToday } from '@/time/today';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

const SIMULATIONS: { value: MockSimulation; label: string }[] = [
  { value: 'working', label: 'Working' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'failing', label: 'Failing' },
];

export default function MockSteps() {
  if (!__DEV__ || stepSource.kind !== 'mock') return <Redirect href="/" />;
  return <MockStepsPanel />;
}

function MockStepsPanel() {
  const today = useToday();
  const theme = useTheme();
  const dayOffset = useDev((state) => state.dayOffset);
  const { shiftDays, resetClock } = useDev.getState();
  const steps = useMockStepsOn(today);
  const simulation = useSyncExternalStore(stepSource.subscribe, mockSteps.simulation);

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
      <Text variant="title">
        {today}
        {dayOffset !== 0 && ` (${dayOffset > 0 ? '+' : ''}${dayOffset} days)`}
      </Text>
      <Text>{steps.toLocaleString()} steps today</Text>

      <Section title="Add steps to today">
        {[500, 2000, 6000, 20000].map((n) => (
          <Button key={n} label={`+${n.toLocaleString()}`} onPress={() => mockSteps.add(today, n)} />
        ))}
        <Button label="Set to 0" onPress={() => mockSteps.set(today, 0)} />
      </Section>

      <Section title="Clock">
        <Button label="← Day" onPress={() => shiftDays(-1)} />
        <Button label="Day →" onPress={() => shiftDays(1)} />
        <Button label="Real today" onPress={resetClock} />
      </Section>

      <Section title="Apple Health">
        {SIMULATIONS.map(({ value, label }) => (
          <Button key={value} label={label} selected={simulation === value} onPress={() => mockSteps.simulate(value)} />
        ))}
      </Section>

      <Section title="Reset">
        <Button label="Clear all mock steps" onPress={mockSteps.clear} />
        <Button label="Demo: 3 weeks of walks" onPress={() => demoHistory(today)} />
        <Button label="Demo: 120-day streak" onPress={() => demoStreak(today)} />
        <Button label="Restart journey today" onPress={() => useSettings.getState().restartJourney(today)} />
      </Section>
    </ScrollView>
  );
}

const DEMO_STEPS = [4200, 7100, 0, 9300, 6500, 3100, 12400, 8000, 5200, 0, 6100, 7400, 2600, 6800, 15000, 6200, 4800, 7600, 6900, 0, 8800];
const STREAK_DAYS = 120;

function demoHistory(today: LocalDate) {
  mockSteps.setMany(Object.fromEntries(DEMO_STEPS.map((steps, i) => [addDays(today, i - DEMO_STEPS.length), steps])));
  useSettings.setState({ journeyStart: addDays(today, -DEMO_STEPS.length) });
}

function demoStreak(today: LocalDate) {
  mockSteps.setMany(Object.fromEntries(Array.from({ length: STREAK_DAYS }, (_, i) => [addDays(today, -(i + 1)), 40000])));
  useSettings.setState({ journeyStart: addDays(today, -STREAK_DAYS) });
}

function useMockStepsOn(date: ReturnType<typeof useToday>): number {
  return useSyncExternalStore(stepSource.subscribe, () => mockSteps.stepsOn(date));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="caption" muted>
        {title}
      </Text>
      <View style={styles.buttons}>{children}</View>
    </View>
  );
}

function Button({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: selected ? theme.blue.strong : theme.fill }, pressed && styles.pressed]}>
      <Text variant="label" style={selected && { color: theme.onStrong }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20 },
  section: { gap: 8 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12 },
  pressed: { opacity: 0.6 },
});

import { Redirect } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { addDays, type LocalDate } from '@/game/date';
import { mockSteps } from '@/steps/mock';
import { useDev } from '@/state/dev';
import { useSettings } from '@/state/settings';
import { stepSource } from '@/steps';
import { useToday } from '@/time/today';

export default function MockSteps() {
  if (!__DEV__ || stepSource.kind !== 'mock') return <Redirect href="/" />;
  return <MockStepsPanel />;
}

function MockStepsPanel() {
  const today = useToday();
  const dayOffset = useDev((state) => state.dayOffset);
  const { shiftDays, resetClock } = useDev.getState();
  const steps = useMockStepsOn(today);

  return (
    <ScrollView contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
      <Text style={styles.heading}>
        {today}
        {dayOffset !== 0 && ` (${dayOffset > 0 ? '+' : ''}${dayOffset} days)`}
      </Text>
      <Text style={styles.steps}>{steps.toLocaleString()} steps today</Text>

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

      <Section title="Reset">
        <Button label="Clear all mock steps" onPress={mockSteps.clear} />
        <Button label="Demo: 3 weeks of walks" onPress={() => demoHistory(today)} />
        <Button label="Restart journey today" onPress={() => useSettings.getState().restartJourney(today)} />
      </Section>
    </ScrollView>
  );
}

const DEMO_STEPS = [4200, 7100, 0, 9300, 6500, 3100, 12400, 8000, 5200, 0, 6100, 7400, 2600, 6800, 15000, 6200, 4800, 7600, 6900, 0, 8800];

function demoHistory(today: LocalDate) {
  DEMO_STEPS.forEach((steps, i) => mockSteps.set(addDays(today, i - DEMO_STEPS.length), steps));
  useSettings.setState({ journeyStart: addDays(today, -DEMO_STEPS.length) });
}

function useMockStepsOn(date: ReturnType<typeof useToday>): number {
  return useSyncExternalStore(stepSource.subscribe, () => mockSteps.stepsOn(date));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.buttons}>{children}</View>
    </View>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20 },
  heading: { fontSize: 22, fontWeight: '700' },
  steps: { fontSize: 17 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', opacity: 0.6 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F2E3CF' },
  pressed: { opacity: 0.6 },
  buttonLabel: { fontSize: 16, fontWeight: '600', color: '#3B2418' },
});

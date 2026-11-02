import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
        <Button label="Restart expedition today" onPress={() => useSettings.getState().resetExpedition(today)} />
      </Section>
    </ScrollView>
  );
}

function useMockStepsOn(date: ReturnType<typeof useToday>): number {
  const [steps, setSteps] = useState(() => mockSteps.stepsOn(date));
  useEffect(() => {
    setSteps(mockSteps.stepsOn(date));
    return stepSource.subscribe(() => setSteps(mockSteps.stepsOn(date)));
  }, [date]);
  return steps;
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

import { router, type Href } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DailyGoalPicker } from '@/components/DailyGoalPicker';
import { goalOn } from '@/game/game';
import { DEFAULT_GOAL, useSettings } from '@/state/settings';
import { stepSource } from '@/steps';
import { useToday } from '@/time/today';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

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
  const today = useToday();
  const goalHistory = useSettings((state) => state.goalHistory);
  const setGoal = useSettings((state) => state.setGoal);
  const goal = goalHistory ? goalOn(goalHistory, today) : DEFAULT_GOAL;

  return (
    <View style={styles.goalSection}>
      <DailyGoalPicker value={goal} onChange={(next) => setGoal(today, next)} />
      <Text variant="detail" muted style={styles.centered}>A new goal starts counting today.</Text>
    </View>
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
  goalSection: { gap: 8 },
  centered: { textAlign: 'center' },
  row: { minHeight: 44, justifyContent: 'center' },
  link: { fontWeight: '600' },
});

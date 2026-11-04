import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DailyGoalPicker } from '@/components/DailyGoalPicker';
import { PandaFill } from '@/components/PandaFill';
import type { AccessState } from '@/state/useHealthAccess';
import { PressableScale } from '@/ui/PressableScale';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

type Props = {
  initialGoal: number;
  status: Extract<AccessState, 'notDetermined' | 'requesting' | 'requestFailed'>;
  onContinue: (goal: number) => void;
};

export function Onboarding({ initialGoal, status, onContinue }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [goal, setGoal] = useState(initialGoal);
  const requesting = status === 'requesting';
  const pandaSize = Math.min(220, width * 0.55, height * 0.25);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.artwork} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <PandaFill progress={0.35} size={pandaSize} animated />
        </View>
        <Text variant="title" accessibilityRole="header" style={styles.centered}>Walk to fill your panda</Text>
        <Text muted style={styles.centered}>Reach your goal to grow your streak.</Text>
        <DailyGoalPicker value={goal} onChange={setGoal} disabled={requesting} />
        {status === 'requestFailed' && (
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.centered}>
            Couldn&apos;t open Apple Health. Try again in a moment.
          </Text>
        )}
      </ScrollView>
      <Text variant="detail" muted style={styles.centered}>
        Only your step count. You choose what to share.
      </Text>
      <PressableScale
        accessibilityRole="button"
        accessibilityState={{ disabled: requesting, busy: requesting }}
        disabled={requesting}
        pressedScale={0.97}
        onPress={() => onContinue(goal)}
        style={[styles.button, { backgroundColor: theme.blue.strong }]}>
        <Text accessibilityLiveRegion="polite" style={[styles.buttonLabel, { color: theme.onStrong }]}>
          {requesting ? 'Opening Apple Health...' : 'Continue to Apple Health'}
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, gap: 16 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', gap: 16, paddingBottom: 8 },
  artwork: { alignItems: 'center' },
  centered: { textAlign: 'center' },
  button: { minHeight: 54, borderRadius: 27, paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { fontWeight: '700', textAlign: 'center' },
});

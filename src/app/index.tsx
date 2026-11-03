import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Confetti } from '@/components/Confetti';
import { HourlyChart } from '@/components/HourlyChart';
import { PandaFill } from '@/components/PandaFill';
import { StepCount } from '@/components/StepCount';
import { WeekTracker } from '@/components/WeekTracker';
import { shouldCelebrateGoal } from '@/game/celebration';
import type { GameState } from '@/game/game';
import { useCelebrations } from '@/state/celebrations';
import { DEFAULT_GOAL, useSettings } from '@/state/settings';
import { useGame, useHourlySteps } from '@/state/useGame';
import { useToday } from '@/time/today';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

/** The hourly chart only earns its place when the panda still gets this much room. */
const ROOMY_HEIGHT = 800;
const CELEBRATION_MS = 3500;

export default function Home() {
  const theme = useTheme();
  const today = useToday();
  const begin = useSettings((state) => state.begin);
  const game = useGame();

  useEffect(() => begin(today, DEFAULT_GOAL), [begin, today]);

  return <View style={[styles.flex, { backgroundColor: theme.background }]}>{game && <HomeContent game={game} />}</View>;
}

function HomeContent({ game }: { game: GameState }) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const hours = useHourlySteps(game.today.date);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const celebrating = useGoalCelebration(game);
  const pandaSize = Math.min(stage.width, stage.height);

  return (
    <View style={[styles.flex, styles.screen, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 12 }]}>
      <Header game={game} />
      <View style={styles.count}>
        <StepCount steps={game.today.steps} goal={game.today.goal} />
      </View>
      <View style={styles.stage} onLayout={(event: LayoutChangeEvent) => setStage(event.nativeEvent.layout)}>
        {pandaSize > 0 && <PandaFill progress={game.today.steps / game.today.goal} size={pandaSize} celebrating={celebrating} />}
      </View>
      <WeekTracker week={game.week} />
      {hours && screenHeight >= ROOMY_HEIGHT && (
        <View style={styles.chart}>
          <HourlyChart hours={hours} currentHour={new Date().getHours()} />
        </View>
      )}
      {celebrating && <Confetti />}
    </View>
  );
}

function Header({ game }: { game: GameState }) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <Text style={styles.date} accessibilityRole="header" numberOfLines={1} maxFontSizeMultiplier={1.4}>
        {formatDate(game.today.date)}
      </Text>
      <StreakBadge streak={game.streak} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Settings"
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.circle, { backgroundColor: theme.fill, transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
        <SymbolView name="gearshape.fill" size={20} tintColor={theme.textMuted} />
      </Pressable>
    </View>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(withSpring(1.25, { damping: 6 }), withSpring(1, { damping: 10 }));
  }, [streak, scale]);

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      accessible
      accessibilityLabel={streak === 1 ? '1-day streak' : `${streak}-day streak`}
      style={[styles.circle, { backgroundColor: theme.blue }, pop]}>
      <Text style={styles.streak} maxFontSizeMultiplier={1.2}>
        {streak}
      </Text>
    </Animated.View>
  );
}

/** True for a few seconds the first time today's goal is met: the panda jumps, confetti falls, the phone taps. */
function useGoalCelebration(game: GameState): boolean {
  const { goalCelebratedOn, celebrating, celebrate, finish } = useCelebrations();
  const due = shouldCelebrateGoal(game, goalCelebratedOn);

  useEffect(() => {
    if (!due) return;
    celebrate(game);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [due, celebrate, game]);

  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(finish, CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebrating, finish]);

  return celebrating;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { paddingHorizontal: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48 },
  date: { flex: 1, fontSize: 17, fontWeight: '700' },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  streak: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  count: { marginTop: 18 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chart: { marginTop: 22 },
});

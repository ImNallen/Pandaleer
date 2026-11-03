import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Confetti } from '@/components/Confetti';
import { DayCard } from '@/components/DayCard';
import { PandaFill } from '@/components/PandaFill';
import { StepCount } from '@/components/StepCount';
import { WeekCard } from '@/components/WeekCard';
import { shouldCelebrateGoal } from '@/game/celebration';
import type { GameState } from '@/game/game';
import { useCelebrations } from '@/state/celebrations';
import { DEFAULT_GOAL, useSettings } from '@/state/settings';
import { useGame, useHourlySteps } from '@/state/useGame';
import { useToday } from '@/time/today';
import { PressableScale } from '@/ui/PressableScale';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

/** The day card only earns its place when the panda still gets this much room. */
const ROOMY_HEIGHT = 800;
const enter = (order: number) => FadeInDown.delay(order * 90).duration(500).springify().damping(18);
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
    <View style={[styles.flex, styles.screen, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 8 }]}>
      <Animated.View entering={enter(0)}>
        <Header streak={game.streak} />
      </Animated.View>
      <Animated.View entering={enter(1)} style={styles.count}>
        <StepCount steps={game.today.steps} goal={game.today.goal} />
      </Animated.View>
      <Animated.View entering={FadeIn.delay(200).duration(700)} style={styles.stage} onLayout={(event: LayoutChangeEvent) => setStage(event.nativeEvent.layout)}>
        {pandaSize > 0 && <PandaFill progress={game.today.steps / game.today.goal} size={pandaSize} celebrating={celebrating} fill="water-rings" />}
      </Animated.View>
      <Animated.View entering={enter(3)}>
        <WeekCard week={game.week} />
      </Animated.View>
      {hours && screenHeight >= ROOMY_HEIGHT && (
        <Animated.View entering={enter(4)} style={styles.dayCard}>
          <DayCard hours={hours} currentHour={new Date().getHours()} />
        </Animated.View>
      )}
      {celebrating && <Confetti />}
    </View>
  );
}

function Header({ streak }: { streak: number }) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <StreakBadge streak={streak} />
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Settings"
        onPress={() => router.push('/settings')}
        style={[styles.settings, { backgroundColor: theme.fill }]}>
        <SymbolView name="gearshape.fill" size={16} tintColor={theme.textMuted} />
      </PressableScale>
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
      style={[styles.streakBadge, { backgroundColor: theme.blue, borderColor: theme.background, shadowColor: theme.blue }, pop]}>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48 },
  streakBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  streak: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  settings: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  count: { marginTop: -2 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayCard: { marginTop: 12 },
});

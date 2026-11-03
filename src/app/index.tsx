import * as Haptics from 'expo-haptics';
import { router, useIsFocused } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PandaPose } from '@/art/skia/pandaPose';
import { Confetti } from '@/components/Confetti';
import { DayCard } from '@/components/DayCard';
import { PandaFill } from '@/components/PandaFill';
import { StepCount } from '@/components/StepCount';
import { StreakBadge } from '@/components/StreakBadge';
import { WeekCard } from '@/components/WeekCard';
import { shouldCelebrateGoal } from '@/game/celebration';
import type { GameState } from '@/game/game';
import { useCelebrations } from '@/state/celebrations';
import { DEFAULT_GOAL, useSettings } from '@/state/settings';
import { useGame, useHourlySteps } from '@/state/useGame';
import { useToday } from '@/time/today';
import { PressableScale } from '@/ui/PressableScale';
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
  const [readyPose, setReadyPose] = useState<PandaPose | null>(null);
  const celebrating = useGoalCelebration(game, readyPose === 'celebrate');
  const pandaSize = Math.min(stage.width, stage.height);

  return (
    <View style={[styles.flex, styles.screen, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 8 }]}>
      <Animated.View entering={enter(0)}>
        <Header streak={game.streak} progress={game.today.steps / game.today.goal} />
      </Animated.View>
      <Animated.View entering={enter(1)} style={styles.count}>
        <StepCount steps={game.today.steps} goal={game.today.goal} />
      </Animated.View>
      <Animated.View entering={FadeIn.delay(200).duration(700)} style={styles.stage} onLayout={(event: LayoutChangeEvent) => setStage(event.nativeEvent.layout)}>
        {pandaSize > 0 && <PandaFill progress={game.today.steps / game.today.goal} size={pandaSize} onPoseReady={setReadyPose} />}
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

function Header({ streak, progress }: { streak: number; progress: number }) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <StreakBadge streak={streak} progress={progress} />
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

function useGoalCelebration(game: GameState, artworkReady: boolean): boolean {
  const focused = useIsFocused();
  const [appState, setAppState] = useState(AppState.currentState);
  const { goalCelebratedOn, celebrating, celebrate, finish } = useCelebrations();
  const visible = focused && appState === 'active';
  const due = visible && artworkReady && shouldCelebrateGoal(game, goalCelebratedOn);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!visible) finish();
    return finish;
  }, [visible, finish]);

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

  return visible && celebrating;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48 },
  settings: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  count: { marginTop: -2 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayCard: { marginTop: 12 },
});

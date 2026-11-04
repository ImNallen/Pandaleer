import * as Haptics from 'expo-haptics';
import { router, useIsFocused } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, AppState, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PandaPose } from '@/art/skia/pandaPose';
import { Confetti } from '@/components/Confetti';
import { DayCard } from '@/components/DayCard';
import { PandaFill } from '@/components/PandaFill';
import { PandaMessage } from '@/components/PandaMessage';
import { StepCount } from '@/components/StepCount';
import { StreakBadge } from '@/components/StreakBadge';
import { WeekCard } from '@/components/WeekCard';
import { shouldCelebrateGoal } from '@/game/celebration';
import type { GameState } from '@/game/game';
import { useCelebrations } from '@/state/celebrations';
import { DEFAULT_GOAL, useSettings } from '@/state/settings';
import { useGame, useHourlySteps } from '@/state/useGame';
import { useHealthAccess } from '@/state/useHealthAccess';
import { stepSource } from '@/steps';
import { useToday } from '@/time/today';
import { PressableScale } from '@/ui/PressableScale';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

/** The day card only earns its place when the panda still gets this much room. */
const ROOMY_HEIGHT = 800;
const enter = (order: number) => FadeInDown.delay(order * 90).duration(500).springify().damping(18);
const CELEBRATION_MS = 3500;
/** Answers quicker than this never show a spinner, so a normal launch doesn't flicker. */
const SPINNER_DELAY_MS = 400;

export default function Home() {
  const theme = useTheme();
  const today = useToday();
  const begin = useSettings((state) => state.begin);
  const { access, check, request } = useHealthAccess();

  useEffect(() => begin(today, DEFAULT_GOAL), [begin, today]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {access === 'requested' && <Tracker />}
      {access === 'notDetermined' && (
        <PandaMessage
          title="Walk to fill your panda"
          body="Pandaleer reads your step count from Apple Health. That's all it needs to track your goal and streak."
          fill={0.2}
          action={{ label: 'Continue', onPress: request }}
        />
      )}
      {access === 'unavailable' && (
        <PandaMessage title="Apple Health isn't available" body="Pandaleer gets your steps from Apple Health, which this device doesn't support." />
      )}
      {access === 'failed' && (
        <PandaMessage
          title="Couldn't reach Apple Health"
          body="Something went wrong asking for access to your steps. Try again in a moment."
          action={{ label: 'Try again', onPress: check }}
        />
      )}
    </View>
  );
}

function Tracker() {
  const { game, hasSteps, failed, retry } = useGame();
  if (game) return <HomeContent game={game} hasSteps={hasSteps} />;
  if (failed) {
    return <PandaMessage title="Couldn't read your steps" body="Apple Health didn't respond. Try again in a moment." action={{ label: 'Try again', onPress: retry }} />;
  }
  return <Loading />;
}

function Loading() {
  const theme = useTheme();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), SPINNER_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return <View style={[styles.flex, styles.centered]}>{waited && <ActivityIndicator color={theme.textMuted} accessibilityLabel="Loading your steps" />}</View>;
}

function HomeContent({ game, hasSteps }: { game: GameState; hasSteps: boolean }) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const hours = useHourlySteps(game.today.date);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [readyPose, setReadyPose] = useState<PandaPose | null>(null);
  const visible = useScreenVisible();
  const celebrating = useGoalCelebration(game, visible, readyPose === 'celebrate');
  const pandaSize = Math.min(stage.width, stage.height);

  return (
    <View style={[styles.flex, styles.screen, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 8 }]}>
      <Animated.View entering={enter(0)}>
        <Header streak={game.streak} progress={game.today.steps / game.today.goal} />
      </Animated.View>
      <Animated.View entering={enter(1)} style={styles.count}>
        <StepCount steps={game.today.steps} goal={game.today.goal} />
        {!hasSteps && stepSource.kind === 'healthkit' && <HealthAccessHint />}
      </Animated.View>
      <Animated.View entering={FadeIn.delay(200).duration(700)} style={styles.stage} onLayout={(event: LayoutChangeEvent) => setStage(event.nativeEvent.layout)}>
        {pandaSize > 0 && <PandaFill progress={game.today.steps / game.today.goal} size={pandaSize} animated={visible} onPoseReady={setReadyPose} />}
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
      <PressableScale accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={styles.settings}>
        <View style={[styles.settingsCircle, { backgroundColor: theme.fill }]}>
          <SymbolView name="gearshape.fill" size={16} tintColor={theme.textMuted} />
        </View>
      </PressableScale>
    </View>
  );
}

/** HealthKit never says when read access was denied, so an empty history is the only hint there is. */
function HealthAccessHint() {
  const theme = useTheme();
  return (
    <PressableScale accessibilityRole="button" pressedScale={0.97} onPress={() => router.push('/settings')} style={styles.hint}>
      <Text variant="label" style={[styles.hintLabel, { color: theme.link }]}>
        Not seeing your steps? Check Health access
      </Text>
    </PressableScale>
  );
}

function useScreenVisible(): boolean {
  const focused = useIsFocused();
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  return focused && appState === 'active';
}

function useGoalCelebration(game: GameState, visible: boolean, artworkReady: boolean): boolean {
  const { goalCelebratedOn, celebrating, celebrate, finish } = useCelebrations();
  const due = visible && artworkReady && shouldCelebrateGoal(game, goalCelebratedOn);

  useEffect(() => {
    if (!visible) finish();
    return finish;
  }, [visible, finish]);

  useEffect(() => {
    if (!due) return;
    celebrate(game);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AccessibilityInfo.announceForAccessibility('Goal reached! Your panda is full.');
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
  centered: { alignItems: 'center', justifyContent: 'center' },
  screen: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48 },
  settings: { width: 44, height: 44, marginRight: -4, alignItems: 'center', justifyContent: 'center' },
  settingsCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  count: { marginTop: -2 },
  hint: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  hintLabel: { textAlign: 'center' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayCard: { marginTop: 12 },
});

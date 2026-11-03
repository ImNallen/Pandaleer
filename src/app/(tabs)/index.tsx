import { Link } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Campfire } from '@/art/Campfire';
import { Panda } from '@/art/panda/Panda';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { ProgressRing } from '@/components/ProgressRing';
import { fireCopy, todayLine } from '@/copy';
import { shouldCelebrateGoal } from '@/game/celebration';
import type { GameState } from '@/game/game';
import { useCelebrations } from '@/state/celebrations';
import { DEFAULT_GOAL, useSettings } from '@/state/settings';
import { useGame } from '@/state/useGame';
import { useToday } from '@/time/today';
import { Card } from '@/ui/Card';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

export default function Today() {
  const theme = useTheme();
  const today = useToday();
  const begin = useSettings((state) => state.begin);
  const game = useGame();

  useEffect(() => begin(today, DEFAULT_GOAL), [begin, today]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {game && <TodayContent game={game} />}
      {game && <Celebrations game={game} />}
    </View>
  );
}

function TodayContent({ game }: { game: GameState }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ring = Math.min(width - 48, 320);
  const { steps, goal, met: goalMet, pose } = game.today;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 96 }]}>
      <View>
        <Text variant="caption" muted>
          {formatDate(game.today.date)}
        </Text>
        <Text variant="title" accessibilityRole="header">
          Today
        </Text>
      </View>

      <View style={styles.hero}>
        <ProgressRing progress={steps / goal} size={ring} stroke={16} complete={goalMet}>
          <Panda pose={pose} size={ring * 0.78} animated />
        </ProgressRing>
        <View style={styles.count} accessible accessibilityLabel={`${steps.toLocaleString()} of ${goal.toLocaleString()} steps today`}>
          <Text variant="display" maxFontSizeMultiplier={1.4}>
            {steps.toLocaleString()}
          </Text>
          <Text muted>of {goal.toLocaleString()} steps</Text>
        </View>
      </View>

      <SpeechBubble line={todayLine(game.today)} />
      <FireCard game={game} />

      {__DEV__ && <DevLinks />}
    </ScrollView>
  );
}

function SpeechBubble({ line }: { line: string }) {
  const theme = useTheme();
  return (
    <View accessible accessibilityLabel={`The panda says: ${line}`}>
      <View style={[styles.bubbleTail, { borderBottomColor: theme.surface }]} />
      <Card>
        <Text>{line}</Text>
      </Card>
    </View>
  );
}

function FireCard({ game }: { game: GameState }) {
  const { title, detail } = fireCopy(game.campfire, game.today.met);
  const stacked = useWindowDimensions().fontScale >= 1.4;
  return (
    <Card style={stacked ? styles.gap : styles.row}>
      <Campfire fire={game.campfire} size={84} animated />
      <View style={styles.flex} accessible>
        <Text variant="heading">{title}</Text>
        <Text muted>{detail}</Text>
      </View>
    </Card>
  );
}

function Celebrations({ game }: { game: GameState }) {
  const { goalCelebratedOn, acknowledge } = useCelebrations();
  if (!shouldCelebrateGoal(game, goalCelebratedOn)) return null;
  return <CelebrationOverlay fire={game.campfire} onDone={() => acknowledge(game)} />;
}

function DevLinks() {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Link href="/dev/steps">
        <Text variant="caption" style={{ color: theme.accent }}>
          Mock steps
        </Text>
      </Link>
      <Link href="/dev/gallery">
        <Text variant="caption" style={{ color: theme.accent }}>
          Art Gallery
        </Text>
      </Link>
    </View>
  );
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 16 },
  hero: { alignItems: 'center', gap: 4 },
  count: { alignItems: 'center' },
  bubbleTail: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flex: { flex: 1, gap: 2 },
  gap: { gap: 6 },
  track: { height: 12, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
});

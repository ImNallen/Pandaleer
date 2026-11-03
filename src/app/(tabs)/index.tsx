import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
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
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

/** Room the floating native tab bar takes above the home indicator. */
const TAB_BAR = 70;

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
  const [hero, setHero] = useState({ width: 0, height: 0 });
  const ring = Math.min(hero.width, hero.height, 340);
  const { steps, goal, met, pose } = game.today;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + TAB_BAR }]}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="caption" muted maxFontSizeMultiplier={1.6} numberOfLines={1}>
            {formatDate(game.today.date)}
          </Text>
          <Text variant="title" accessibilityRole="header" maxFontSizeMultiplier={1.4}>
            Today
          </Text>
        </View>
        <StreakChip game={game} />
      </View>

      <View style={styles.hero} onLayout={(event: LayoutChangeEvent) => setHero(event.nativeEvent.layout)}>
        {ring > 0 && (
          <ProgressRing progress={steps / goal} size={ring} stroke={Math.max(10, ring * 0.05)} complete={met}>
            <Panda pose={pose} size={ring * 0.78} animated />
          </ProgressRing>
        )}
      </View>

      <View style={styles.count} accessible accessibilityLabel={`${steps.toLocaleString()} of ${goal.toLocaleString()} steps today`}>
        <Text variant="display" maxFontSizeMultiplier={1.3}>
          {steps.toLocaleString()}
        </Text>
        <Text muted maxFontSizeMultiplier={1.6}>
          of {goal.toLocaleString()} steps
        </Text>
      </View>

      <Text style={styles.line} maxFontSizeMultiplier={1.6} accessibilityLabel={`The panda says: ${todayLine(game.today)}`}>
        {todayLine(game.today)}
      </Text>
    </View>
  );
}

function StreakChip({ game }: { game: GameState }) {
  const theme = useTheme();
  const { title, detail } = fireCopy(game.campfire, game.today.met);
  const days = game.campfire.kind === 'burning' ? game.campfire.days : 0;
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${detail}`}
      style={[styles.chip, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
      <Campfire fire={game.campfire} size={40} animated />
      <Text variant="heading" maxFontSizeMultiplier={1.4}>
        {days}
      </Text>
    </View>
  );
}

function Celebrations({ game }: { game: GameState }) {
  const { goalCelebratedOn, acknowledge } = useCelebrations();
  if (!shouldCelebrateGoal(game, goalCelebratedOn)) return null;
  return <CelebrationOverlay fire={game.campfire} onDone={() => acknowledge(game)} />;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 2,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  count: { alignItems: 'center' },
  line: { textAlign: 'center', paddingHorizontal: 8 },
});

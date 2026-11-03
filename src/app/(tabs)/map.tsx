import { memo, useMemo } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DayMarker, type DayState } from '@/art/map/DayMarker';
import { MapScenery } from '@/art/map/MapScenery';
import { Panda } from '@/art/panda/Panda';
import type { Day, Pose } from '@/game/game';
import { groupWeeks, layoutWeek, type DayStop, type Week } from '@/map/layout';
import { useGame } from '@/state/useGame';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

const PANDA = 76;
const MARKER = 40;

export default function DaysMap() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const game = useGame();
  const weeks = useMemo(() => (game ? groupWeeks(game.days) : []), [game]);
  const thisWeek = weeks[0];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {game && (
        <FlatList
          data={weeks}
          keyExtractor={(week) => week.monday}
          renderItem={({ item }) => <WeekView week={item} width={width} pose={game.today.pose} />}
          initialNumToRender={2}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 70 }}
        />
      )}
      {thisWeek && (
        <View style={[styles.header, { top: insets.top + 6 }]} pointerEvents="none">
          <View style={[styles.headerCard, { backgroundColor: theme.surface, shadowColor: theme.shadow }]} accessible accessibilityRole="header">
            <Text variant="heading">Your trail</Text>
            <Text variant="caption" muted>
              This week: {goalsMet(thisWeek.days)} of {thisWeek.days.length} goals · {totalSteps(thisWeek.days).toLocaleString()} steps
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const WeekView = memo(function WeekView({ week, width, pose }: { week: Week; width: number; pose: Pose }) {
  const theme = useTheme();
  const layout = useMemo(() => layoutWeek(week, width), [week, width]);
  const today = week.current ? layout.stops.at(-1) : undefined;
  const banner = `${week.current ? 'This week' : `Week of ${formatDay(week.monday, { day: 'numeric', month: 'short' })}`} · ${goalsMet(week.days)} of ${week.days.length} goals`;

  return (
    <View style={{ width, height: layout.height }}>
      <MapScenery layout={layout} />
      {layout.stops.map((stop) => (stop === today ? null : <Camp key={stop.day.date} stop={stop} />))}
      {today && (
        <View
          pointerEvents="none"
          accessible
          accessibilityLabel={`Today the panda has walked ${today.day.steps.toLocaleString()} steps`}
          style={[styles.absolute, { left: today.x - PANDA / 2, top: today.y - PANDA * 0.88 }]}>
          <Panda pose={pose} size={PANDA} animated />
        </View>
      )}
      <View pointerEvents="box-none" style={[styles.bannerRow, { top: layout.banner.y - 15 }]}>
        <View
          accessible
          accessibilityLabel={week.startsJourney ? `${banner}. Our journey began here.` : banner}
          style={[styles.banner, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
          <Text variant="caption" numberOfLines={1}>
            {week.startsJourney ? `🚩 ${banner}` : banner}
          </Text>
        </View>
      </View>
    </View>
  );
});

function Camp({ stop }: { stop: DayStop }) {
  const theme = useTheme();
  const { day } = stop;
  const state: DayState = day.met ? 'met' : day.steps > 0 ? 'walked' : 'rest';
  const status = state === 'met' ? 'goal met' : state === 'walked' ? `${Math.round((day.steps / day.goal) * 100)}% of goal` : 'rest day';
  return (
    <>
      <View pointerEvents="none" style={[styles.absolute, { left: stop.x - MARKER / 2, top: stop.y - MARKER * 0.8 }]}>
        <DayMarker state={state} size={MARKER} />
      </View>
      <View
        accessible
        accessibilityLabel={`${formatDay(day.date, { weekday: 'long', day: 'numeric', month: 'long' })}: ${day.steps.toLocaleString()} steps, ${status}`}
        style={[
          styles.pill,
          styles.label,
          { top: stop.y - 24, backgroundColor: theme.surface, shadowColor: theme.shadow, opacity: state === 'rest' ? 0.85 : 1 },
          stop.labelSide === 1 ? { left: stop.x + 26 } : { left: stop.x - 26 - 150 },
        ]}>
        <Text variant="caption" numberOfLines={1}>
          {formatDay(day.date, { weekday: 'short', day: 'numeric', month: 'short' })}
        </Text>
        <Text variant="caption" muted style={styles.small} numberOfLines={1}>
          {day.steps.toLocaleString()} steps
        </Text>
      </View>
    </>
  );
}

const goalsMet = (days: readonly Day[]) => days.filter((day) => day.met).length;
const totalSteps = (days: readonly Day[]) => days.reduce((sum, day) => sum + day.steps, 0);

function formatDay(date: string, options: Intl.DateTimeFormatOptions): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, options);
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
  header: { position: 'absolute', left: 16, right: 16 },
  headerCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  pill: {
    position: 'absolute',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  label: { width: 150 },
  bannerRow: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  banner: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  small: { fontSize: 12 },
});

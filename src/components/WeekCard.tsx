import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import type { WeekDay, WeekDayState } from '@/game/game';
import { PressableScale } from '@/ui/PressableScale';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

const CAPSULE = { width: 30, height: 64 };
/** Lets day buttons run past the card's padding: 44pt wide on the narrowest phones, capsules still lined up with the title. */
const DAYS_OUTSET = 5;

const SPOKEN: Record<WeekDayState, string> = {
  met: 'goal met',
  missed: 'goal missed',
  today: 'today, in progress',
  upcoming: 'still to come',
  unknown: 'before your journey began',
};

/** This week as seven capsules that fill with each day's progress. Tap one to see its steps. */
export function WeekCard({ week }: { week: readonly WeekDay[] }) {
  const theme = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const met = week.filter((day) => day.state === 'met').length;
  const played = week.filter((day) => day.state !== 'upcoming' && day.state !== 'unknown').length;
  const picked = week.find((day) => day.date === selected);

  return (
    <View style={[styles.card, { backgroundColor: theme.blue.faint }]}>
      <View style={styles.header}>
        <Text variant="heading" accessibilityRole="header">
          This week
        </Text>
        <Text variant="detail" muted style={styles.detail}>
          {picked ? `${weekdayName(picked.date, 'short')} · ${picked.steps.toLocaleString()} steps` : `${met} of ${played} ${played === 1 ? 'day' : 'days'}`}
        </Text>
      </View>
      <View style={styles.days}>
        {week.map((day, i) => (
          <PressableScale
            key={day.date}
            pressedScale={0.88}
            disabled={day.state === 'upcoming'}
            onPress={() => {
              Haptics.selectionAsync();
              setSelected((current) => (current === day.date ? null : day.date));
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: day.date === selected }}
            accessibilityLabel={`${weekdayName(day.date, 'long')}: ${day.steps.toLocaleString()} steps, ${SPOKEN[day.state]}`}
            style={styles.day}>
            <Capsule day={day} index={i} selected={day.date === selected} />
            <Text variant="caption" muted={day.state !== 'today'}>
              {weekdayName(day.date, 'narrow')}
            </Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

function Capsule({ day, index, selected }: { day: WeekDay; index: number; selected: boolean }) {
  const theme = useTheme();
  const share = day.state === 'upcoming' || day.state === 'unknown' ? 0 : Math.min(1, day.steps / day.goal);
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(120 + index * 70, withTiming(share, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [share, index, fill]);

  const level = useAnimatedStyle(() => ({ height: fill.value * CAPSULE.height }));
  const ring = selected ? theme.text : day.state === 'today' ? theme.blue.strong : 'transparent';
  /** A pale fill alone is hard to tell from its track, so its surface gets a strong line, like the panda's water. */
  const surface = share > 0 && !day.met ? { borderTopWidth: 2, borderTopColor: theme.blue.strong } : null;

  return (
    <View style={[styles.capsuleRing, { borderColor: ring }]}>
      <View style={[styles.capsule, { backgroundColor: theme.blue.soft, opacity: day.state === 'upcoming' ? 0.5 : 1 }]}>
        <Animated.View style={[styles.fill, { backgroundColor: day.met ? theme.blue.strong : theme.blue.light }, surface, level]} />
        {day.state === 'met' && (
          <View style={styles.check}>
            <SymbolView name="checkmark" size={13} weight="heavy" tintColor={theme.onStrong} />
          </View>
        )}
      </View>
    </View>
  );
}

function weekdayName(date: string, width: 'long' | 'short' | 'narrow'): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: width });
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12, gap: 12 },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: 12 },
  detail: { flexShrink: 1 },
  days: { flexDirection: 'row', marginHorizontal: -DAYS_OUTSET },
  day: { flex: 1, alignItems: 'center', gap: 6 },
  capsuleRing: { borderWidth: 2, borderRadius: CAPSULE.width / 2 + 4, padding: 2 },
  capsule: { width: CAPSULE.width, height: CAPSULE.height, borderRadius: CAPSULE.width / 2, overflow: 'hidden', justifyContent: 'flex-end' },
  fill: { width: '100%', borderRadius: CAPSULE.width / 2 },
  check: { position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center' },
});

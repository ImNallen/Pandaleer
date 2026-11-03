import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Circle, Path, Svg } from 'react-native-svg';

import type { WeekDay, WeekDayState } from '@/game/game';
import { Text } from '@/ui/Text';
import { useTheme, type Theme } from '@/ui/tokens';

const SIZE = 36;
const STROKE = 3.5;

const SPOKEN: Record<WeekDayState, string> = {
  met: 'goal met',
  missed: 'goal missed',
  today: 'today, in progress',
  upcoming: 'still to come',
  unknown: 'before your journey began',
};

/** Monday to Sunday; a fresh row every Monday. */
export function WeekTracker({ week }: { week: readonly WeekDay[] }) {
  return (
    <View style={styles.row}>
      {week.map((day, i) => (
        <Animated.View
          key={day.date}
          entering={ZoomIn.delay(i * 60).springify().damping(14)}
          style={styles.day}
          accessible
          accessibilityLabel={`${weekdayName(day.date, 'long')}: ${day.steps.toLocaleString()} steps, ${SPOKEN[day.state]}`}>
          <DayCircle day={day} />
          <Text variant="caption" muted={day.state !== 'today'} style={styles.letter} maxFontSizeMultiplier={1.4}>
            {weekdayName(day.date, 'narrow')}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

function DayCircle({ day }: { day: WeekDay }) {
  const theme = useTheme();
  const r = (SIZE - STROKE) / 2;
  const c = SIZE / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <Svg width={SIZE} height={SIZE}>
      {CIRCLES[day.state](theme, { r, c, circumference, progress: Math.min(1, day.steps / day.goal) })}
    </Svg>
  );
}

type Geometry = { r: number; c: number; circumference: number; progress: number };

const CIRCLES: Record<WeekDayState, (theme: Theme, g: Geometry) => React.ReactElement> = {
  met: (theme, { c }) => (
    <>
      <Circle cx={c} cy={c} r={c} fill={theme.orange} />
      <Path d={`M ${c - 7} ${c + 0.5} L ${c - 2} ${c + 5.5} L ${c + 7.5} ${c - 5}`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  missed: (theme, { c }) => <Circle cx={c} cy={c} r={c} fill={theme.fill} />,
  today: (theme, { r, c, circumference, progress }) => (
    <>
      <Circle cx={c} cy={c} r={r} stroke={theme.hairline} strokeWidth={STROKE} fill="none" />
      <Circle
        cx={c}
        cy={c}
        r={r}
        stroke={theme.blue}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${circumference * progress} ${circumference}`}
        transform={`rotate(-90 ${c} ${c})`}
        fill="none"
      />
    </>
  ),
  upcoming: (theme, { r, c }) => <Circle cx={c} cy={c} r={r} stroke={theme.hairline} strokeWidth={2} fill="none" />,
  unknown: (theme, { r, c }) => <Circle cx={c} cy={c} r={r} stroke={theme.hairline} strokeWidth={2} strokeDasharray="3 4" fill="none" />,
};

function weekdayName(date: string, width: 'long' | 'narrow'): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: width });
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 6 },
  letter: { fontSize: 13 },
});

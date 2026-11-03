import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

type Props = { streak: number; litToday: boolean };

/**
 * A flame and the streak count. Bold blue once today's goal is met; quiet and outlined while today
 * still has to be walked, so the badge itself says whether the streak is safe.
 */
export function StreakBadge({ streak, litToday }: Props) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(withSpring(1.18, { damping: 7 }), withSpring(1, { damping: 11 }));
  }, [streak, litToday, scale]);

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const style = litToday
    ? { backgroundColor: theme.blue.strong, borderColor: theme.background, shadowColor: theme.blue.light, shadowOpacity: 0.45 }
    : { backgroundColor: theme.blue.faint, borderColor: theme.blue.soft, shadowOpacity: 0 };
  const ink = litToday ? '#FFFFFF' : theme.blue.strong;
  const days = streak === 1 ? '1-day streak' : `${streak}-day streak`;

  return (
    <Animated.View
      accessible
      accessibilityLabel={litToday ? `${days}, today's goal is done` : streak > 0 ? `${days}, walk today to keep it going` : 'No streak yet, reach today’s goal to start one'}
      style={[styles.badge, style, pop]}>
      <SymbolView
        key={`${streak}-${litToday}`}
        name={litToday ? 'flame.fill' : 'flame'}
        size={17}
        weight="bold"
        tintColor={ink}
        animationSpec={reduceMotion ? undefined : { effect: { type: 'bounce', wholeSymbol: true }, repeating: false }}
      />
      <Text style={[styles.count, { color: ink }]} maxFontSizeMultiplier={1.3}>
        {streak}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingLeft: 10,
    paddingRight: 13,
    borderRadius: 18,
    borderWidth: 2.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  count: { fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
});

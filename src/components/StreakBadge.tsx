import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

/** Matches the settings button beside it. */
const SIZE = 36;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CORE = SIZE - 2 * (STROKE + 2.5);

/** A full circle starting at twelve o'clock, so trimming its end draws today's progress clockwise. */
const ARC = Skia.Path.MakeFromSVGString(
  `M ${SIZE / 2} ${STROKE / 2} A ${RADIUS} ${RADIUS} 0 1 1 ${SIZE / 2 - 0.01} ${STROKE / 2}`,
)!;

type Props = { streak: number; progress: number };

/** The streak count in a blue circle, ringed by today's progress toward the goal. */
export function StreakBadge({ streak, progress }: Props) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const arc = useSharedValue(0);
  const share = Math.min(1, progress);

  useEffect(() => {
    scale.value = withSequence(withSpring(1.15, { damping: 7 }), withSpring(1, { damping: 11 }));
  }, [streak, scale]);

  useEffect(() => {
    arc.value = withTiming(share, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [share, arc]);

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const days = streak === 1 ? '1-day streak' : `${streak}-day streak`;

  return (
    <Animated.View
      accessible
      accessibilityLabel={`${days}. Today ${Math.floor(share * 100)}% of your goal.`}
      style={[styles.badge, pop]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} style="stroke" strokeWidth={STROKE} color={theme.blue.soft} />
        <Path path={ARC} style="stroke" strokeWidth={STROKE} strokeCap="round" color={theme.blue.strong} start={0} end={arc} />
      </Canvas>
      <View style={[styles.core, { backgroundColor: theme.blue.strong, shadowColor: theme.blue.light }]}>
        <Text style={styles.count} maxFontSizeMultiplier={1.2}>
          {streak}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: CORE,
    height: CORE,
    borderRadius: CORE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  count: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
});

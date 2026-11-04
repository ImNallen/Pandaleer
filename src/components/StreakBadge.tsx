import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

/** Matches the settings button beside it. */
const SIZE = 36;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;

/** A full circle starting at twelve o'clock, so trimming its end draws today's progress clockwise. */
const ARC = Skia.Path.MakeFromSVGString(
  `M ${SIZE / 2} ${STROKE / 2} A ${RADIUS} ${RADIUS} 0 1 1 ${SIZE / 2 - 0.01} ${STROKE / 2}`,
)!;

type Props = { streak: number; progress: number };

/** The streak count in a light-blue circle, ringed by today's progress toward the goal. */
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
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} color={theme.blue.light} />
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} style="stroke" strokeWidth={STROKE} color={theme.blue.soft} />
        <Path path={ARC} style="stroke" strokeWidth={STROKE} strokeCap="round" color={theme.blue.strong} start={0} end={arc} />
      </Canvas>
      <Text
        variant="label"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        style={[styles.count, { color: theme.onLight }]}
        maxFontSizeMultiplier={1.2}>
        {streak}
      </Text>
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
  count: { width: SIZE - 2 * STROKE, textAlign: 'center', fontWeight: '900', fontVariant: ['tabular-nums'] },
});

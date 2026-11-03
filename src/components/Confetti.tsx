import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { useTheme, type Theme } from '@/ui/tokens';

const SHADES: { scale: 'blue' | 'green'; tone: keyof Theme['blue'] }[] = [
  { scale: 'blue', tone: 'strong' },
  { scale: 'blue', tone: 'light' },
  { scale: 'blue', tone: 'soft' },
  { scale: 'green', tone: 'light' },
  { scale: 'green', tone: 'strong' },
];

const PIECES = Array.from({ length: 28 }, (_, i) => ({
  x: ((i * 37) % 100) / 100,
  delay: (i * 53) % 600,
  drift: ((i * 29) % 40) - 20,
  spin: 180 + ((i * 71) % 360),
  shade: SHADES[i % SHADES.length],
  wide: i % 3 === 0,
}));

export function Confetti() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PIECES.map((piece, i) => (
        <Piece key={i} {...piece} />
      ))}
    </View>
  );
}

function Piece({ x, delay, drift, spin, shade, wide }: (typeof PIECES)[number]) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const fall = useSharedValue(0);

  useEffect(() => {
    fall.value = withDelay(delay, withTiming(1, { duration: 2600, easing: Easing.in(Easing.quad) }));
  }, [delay, fall]);

  const style = useAnimatedStyle(() => ({
    opacity: fall.value < 0.85 ? 1 : (1 - fall.value) / 0.15,
    transform: [
      { translateX: x * width + drift * fall.value * 3 },
      { translateY: -40 + fall.value * (height + 80) },
      { rotate: `${spin * fall.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', width: wide ? 14 : 9, height: wide ? 8 : 12, borderRadius: 3, backgroundColor: theme[shade.scale][shade.tone] }, style]}
    />
  );
}

import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const COLORS = ['#4CA8FF', '#55CF8C', '#FFD166', '#FF7F79', '#FF8FC6', '#B895FF', '#FFAA57', '#65D8E6'];
const PIECE_COUNT = 72;

type ConfettiPiece = {
  x: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  rotation: number;
  sway: number;
  flutter: number;
  phase: number;
  color: string;
  width: number;
  height: number;
  borderRadius: number;
};

function createPieces(): ConfettiPiece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => {
    const size = 6 + Math.random() * 6;
    const shape = Math.random();
    return {
      x: (i + Math.random()) / PIECE_COUNT,
      delay: Math.random() * 600,
      duration: 2100 + Math.random() * 700,
      drift: (Math.random() - 0.5) * 90,
      spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
      rotation: Math.random() * 360,
      sway: 8 + Math.random() * 16,
      flutter: 1.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      width: shape < 0.2 ? size : shape < 0.65 ? size * 0.6 : size,
      height: shape < 0.2 ? size : shape < 0.65 ? size * 1.9 : size,
      borderRadius: shape < 0.2 ? size / 2 : 2,
    };
  });
}

export function Confetti() {
  const reduceMotion = useReducedMotion();
  return reduceMotion ? null : <Shower />;
}

function Shower() {
  const [pieces] = useState(createPieces);
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shower]}>
      {pieces.map((piece, i) => <Piece key={i} {...piece} screenWidth={width} screenHeight={height} />)}
    </View>
  );
}

function Piece({ x, delay, duration, drift, spin, rotation, sway, flutter, phase, color, width, height, borderRadius, screenWidth, screenHeight }: ConfettiPiece & { screenWidth: number; screenHeight: number }) {
  const fall = useSharedValue(0);

  useEffect(() => {
    fall.value = withDelay(delay, withTiming(1, { duration, easing: Easing.in(Easing.quad) }));
    return () => cancelAnimation(fall);
  }, [delay, duration, fall]);

  const style = useAnimatedStyle(() => {
    const progress = fall.value;
    const flutterAngle = progress * Math.PI * 2 * flutter + phase;
    return {
      opacity: progress < 0.82 ? 1 : (1 - progress) / 0.18,
      transform: [
        { translateX: x * (screenWidth - width) + drift * progress + sway * (Math.sin(flutterAngle) - Math.sin(phase)) },
        { translateY: -40 + progress * (screenHeight + 80) },
        { rotate: `${rotation + spin * progress}deg` },
        { scaleX: 0.55 + 0.45 * Math.abs(Math.cos(flutterAngle)) },
      ],
    };
  });

  return <Animated.View style={[{ position: 'absolute', width, height, borderRadius, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  shower: { overflow: 'hidden' },
});

import { useEffect, useId } from 'react';
import { G } from 'react-native-svg';
import Animated, { useFrameCallback, useReducedMotion, useSharedValue, type SharedValue } from 'react-native-reanimated';

export const AnimatedG = Animated.createAnimatedComponent(G);

/** Seconds since motion started; stays at 0 when not animated or when Reduce Motion is on. */
export function useArtClock(animated: boolean): SharedValue<number> {
  const reduceMotion = useReducedMotion();
  const time = useSharedValue(0);
  const frame = useFrameCallback((info) => {
    time.value = info.timeSinceFirstFrame / 1000;
  }, false);

  const active = animated && !reduceMotion;
  useEffect(() => {
    frame.setActive(active);
    if (!active) time.value = 0;
  }, [active, frame, time]);

  return time;
}

export function wave(t: number, period: number, phase = 0): number {
  'worklet';
  return Math.sin((2 * Math.PI * t) / period + phase);
}

/** react-native-svg's native `matrix` prop: [a, b, c, d, e, f]. */
export type Matrix = [number, number, number, number, number, number];

export function rotateAbout(degrees: number, cx: number, cy: number): Matrix {
  'worklet';
  const r = (degrees * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return [cos, sin, -sin, cos, cx - cos * cx + sin * cy, cy - sin * cx - cos * cy];
}

export function liftAndSquash(dy: number, scaleY: number, groundY: number): Matrix {
  'worklet';
  return [1, 0, 0, scaleY, 0, groundY * (1 - scaleY) + dy];
}

export function translate(dx: number, dy: number): Matrix {
  'worklet';
  return [1, 0, 0, 1, dx, dy];
}

/** An id safe to use inside url(#...). */
export function useSvgId(prefix: string): string {
  return `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

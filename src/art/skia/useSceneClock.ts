import { useClock } from '@shopify/react-native-skia';
import { useDerivedValue, useReducedMotion, type SharedValue } from 'react-native-reanimated';

/** Seconds since mount, frozen at 0 when not animated or when Reduce Motion is on. */
export function useSceneClock(animated: boolean): SharedValue<number> {
  const clock = useClock();
  const reduceMotion = useReducedMotion();
  const live = animated && !reduceMotion;
  return useDerivedValue(() => (live ? clock.value / 1000 : 0));
}

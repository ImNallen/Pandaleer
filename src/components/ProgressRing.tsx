import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import { useTheme } from '@/ui/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { progress: number; size: number; stroke: number; complete: boolean; children: ReactNode };

export function ProgressRing({ progress, size, stroke, complete, children }: Props) {
  const theme = useTheme();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.value = withTiming(Math.min(1, progress), { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress, shown]);

  const arc = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - shown.value) }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={complete ? theme.art.fireDeep : theme.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={arc}
        />
      </Svg>
      {children}
    </View>
  );
}

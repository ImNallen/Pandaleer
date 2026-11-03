import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

import { Panda } from '@/art/panda/Panda';
import { celebrationCopy } from '@/copy';
import type { Campfire } from '@/game/game';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

import { Confetti } from './Confetti';

type Props = { fire: Campfire; onDone: () => void };

export function CelebrationOverlay({ fire, onDone }: Props) {
  const theme = useTheme();
  const { title, message } = celebrationCopy(fire);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AccessibilityInfo.announceForAccessibility(`${title} ${message}`);
  }, [title, message]);

  return (
    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} style={[StyleSheet.absoluteFill, styles.backdrop]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, opacity: 0.94 }]} />
      <Animated.View
        entering={ZoomIn.springify().damping(14)}
        accessibilityViewIsModal
        style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
        <Panda pose="celebrating" size={220} animated />
        <Text variant="title" style={styles.center} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.center}>{message}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onDone}
          style={({ pressed }) => [styles.button, { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 }]}>
          <Text variant="heading" style={{ color: '#FFFFFF' }}>
            Onward!
          </Text>
        </Pressable>
      </Animated.View>
      <Confetti />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    alignItems: 'center',
    gap: 10,
    borderRadius: 32,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  center: { textAlign: 'center' },
  button: { marginTop: 8, borderRadius: 999, paddingHorizontal: 32, paddingVertical: 14 },
});

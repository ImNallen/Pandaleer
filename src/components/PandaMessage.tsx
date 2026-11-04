import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PandaFill } from '@/components/PandaFill';
import { PressableScale } from '@/ui/PressableScale';
import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

type Props = {
  title: string;
  body: string;
  /** How full the panda is drawn; anything above zero shows the water moving. */
  fill?: number;
  action?: { label: string; onPress: () => void };
};

/** A full-screen moment with the panda: first run, or Apple Health not answering. */
export function PandaMessage({ title, body, fill = 0, action }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pandaSize = Math.min(width * 0.72, height * 0.38);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <PandaFill progress={fill} size={pandaSize} animated={fill > 0} />
        </View>
        <Text variant="title" accessibilityRole="header" style={styles.centered}>
          {title}
        </Text>
        <Text muted style={styles.centered}>
          {body}
        </Text>
      </ScrollView>
      {action && (
        <PressableScale
          accessibilityRole="button"
          pressedScale={0.97}
          onPress={action.onPress}
          style={[styles.button, { backgroundColor: theme.blue.strong }]}>
          <Text style={[styles.buttonLabel, { color: theme.onStrong }]}>{action.label}</Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 28, gap: 16 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  centered: { textAlign: 'center' },
  button: { minHeight: 54, borderRadius: 27, paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { fontWeight: '700', textAlign: 'center' },
});

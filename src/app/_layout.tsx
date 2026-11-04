import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/ui/Text';
import { useTheme } from '@/ui/tokens';

const HEADER_TITLE = { fontFamily: 'ui-rounded', fontWeight: '700' } as const;

/** Bar buttons barely grow with Dynamic Type in system apps either, and this one has a fixed capsule to fit. */
function DoneButton() {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.dismiss()} style={styles.done}>
      <Text maxFontSizeMultiplier={1.15} style={[styles.doneLabel, { color: theme.link }]}>
        Done
      </Text>
    </Pressable>
  );
}

export default function RootLayout() {
  const theme = useTheme();
  const navigationTheme = useMemo(() => {
    const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, primary: theme.link, background: theme.background, card: theme.background, text: theme.text, border: theme.hairline },
    };
  }, [theme]);

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false, headerTitleStyle: HEADER_TITLE }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.6, 1],
            sheetGrabberVisible: true,
            headerShown: true,
            title: 'Settings',
            headerRight: () => <DoneButton />,
          }}
        />
        <Stack.Screen name="dev/steps" options={{ headerShown: true, title: 'Mock steps', headerBackTitle: 'Back' }} />
        <Stack.Screen name="dev/gallery" options={{ headerShown: true, title: 'Art Gallery', headerBackTitle: 'Back' }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  done: { paddingHorizontal: 8, minHeight: 28, justifyContent: 'center' },
  doneLabel: { fontWeight: '600' },
});

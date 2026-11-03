import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.6, 1], sheetGrabberVisible: true }} />
      <Stack.Screen name="dev/steps" options={{ headerShown: true, title: 'Mock steps', headerBackTitle: 'Back' }} />
      <Stack.Screen name="dev/gallery" options={{ headerShown: true, title: 'Art Gallery', headerBackTitle: 'Back' }} />
    </Stack>
  );
}

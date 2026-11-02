import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="dev/steps" options={{ headerShown: true, title: 'Mock steps', headerBackTitle: 'Today' }} />
      <Stack.Screen name="dev/gallery" options={{ headerShown: true, title: 'Art Gallery', headerBackTitle: 'Today' }} />
    </Stack>
  );
}

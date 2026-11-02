import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dev/steps" options={{ headerShown: true, title: 'Mock steps', headerBackTitle: 'Today' }} />
    </Stack>
  );
}

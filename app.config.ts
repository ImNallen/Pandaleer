import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Pandaleer',
  slug: 'pandaleer',
  scheme: 'pandaleer',
  version: '1.0.0',
  icon: './assets/branding/app-icon.png',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  platforms: ['ios'],
  ios: {
    bundleIdentifier: 'com.adamnilsson.pandaleer',
    appleTeamId: '46BB5R3Y6W',
    supportsTablet: false,
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;

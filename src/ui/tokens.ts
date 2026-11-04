import { createContext, useContext, useSyncExternalStore } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import { highContrastThemes, themes, type Theme } from './palette';

export { themes, type Theme } from './palette';

let increaseContrast = false;
const listeners = new Set<() => void>();

function setIncreaseContrast(enabled: boolean) {
  increaseContrast = enabled;
  listeners.forEach((listener) => listener());
}

AccessibilityInfo.isDarkerSystemColorsEnabled().then(setIncreaseContrast);
AccessibilityInfo.addEventListener('darkerSystemColorsChanged', setIncreaseContrast);

function subscribeToContrast(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const SchemeOverride = createContext<Theme['scheme'] | null>(null);

/** Forces a color scheme for a subtree, e.g. to show light and dark side by side in the Art Gallery. */
export const SchemeScope = SchemeOverride.Provider;

export function useTheme(): Theme {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const scheme = useContext(SchemeOverride) ?? system;
  const highContrast = useSyncExternalStore(subscribeToContrast, () => increaseContrast);
  return (highContrast ? highContrastThemes : themes)[scheme];
}

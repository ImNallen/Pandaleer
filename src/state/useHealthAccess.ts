import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { stepSource, type HealthAccess } from '@/steps';

type AccessState = HealthAccess | 'checking' | 'failed';

/** Where we stand with Apple Health, rechecked on focus and on every return to the foreground. */
export function useHealthAccess() {
  const focused = useIsFocused();
  const [access, setAccess] = useState<AccessState>('checking');
  const requesting = useRef(false);

  const check = useCallback(() => {
    stepSource.accessStatus().then(setAccess, () => setAccess('failed'));
  }, []);

  const request = useCallback(() => {
    if (requesting.current) return;
    requesting.current = true;
    stepSource
      .requestAccess()
      .then(setAccess, () => setAccess('failed'))
      .finally(() => {
        requesting.current = false;
      });
  }, []);

  useEffect(() => {
    if (!focused) return;
    check();
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && check());
    return () => subscription.remove();
  }, [focused, check]);

  return { access, check, request };
}

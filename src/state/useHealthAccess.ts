import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { stepSource, type HealthAccess } from '@/steps';

export type AccessState = HealthAccess | 'checking' | 'failed' | 'requesting' | 'requestFailed';

/** Where we stand with Apple Health, rechecked on focus and on every return to the foreground. */
export function useHealthAccess() {
  const focused = useIsFocused();
  const [access, setAccess] = useState<AccessState>('checking');
  const requesting = useRef(false);
  const generation = useRef(0);

  const check = useCallback(() => {
    if (requesting.current) return;
    const current = ++generation.current;
    stepSource.accessStatus().then(
      (status) => {
        if (current === generation.current) setAccess(status);
      },
      () => {
        if (current === generation.current) setAccess('failed');
      },
    );
  }, []);

  const request = useCallback(() => {
    if (requesting.current) return;
    requesting.current = true;
    generation.current += 1;
    setAccess('requesting');
    stepSource
      .requestAccess()
      .then(setAccess, () => setAccess('requestFailed'))
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

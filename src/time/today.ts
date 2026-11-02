import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { addDays, type LocalDate } from '@/game/date';
import { useDev } from '@/state/dev';

export function localDateOf(instant: Date): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${instant.getFullYear()}-${pad(instant.getMonth() + 1)}-${pad(instant.getDate())}` as LocalDate;
}

/** The local calendar date, updated at midnight and whenever the app returns to the foreground. */
export function useToday(): LocalDate {
  const dayOffset = useDev((state) => (__DEV__ ? state.dayOffset : 0));
  const [date, setDate] = useState(() => localDateOf(new Date()));

  useEffect(() => {
    const refresh = () => setDate(localDateOf(new Date()));
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 1, 0);
    const timer = setTimeout(refresh, nextMidnight.getTime() - Date.now());
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [date]);

  return addDays(date, dayOffset);
}

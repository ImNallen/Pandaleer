import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { addDays, localDateOf, type LocalDate } from '@/game/date';
import { useDev } from '@/state/dev';

/** The local calendar date, updated at midnight and whenever the app returns to the foreground. */
export function useToday(): LocalDate {
  const dayOffset = useDev((state) => (__DEV__ ? state.dayOffset : 0));
  const [date, setDate] = useState(() => localDateOf(new Date()));

  useEffect(() => {
    // Every check re-arms the timer from the current clock and time zone, so a same-date time zone change can't leave it aimed at the wrong midnight.
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      clearTimeout(timer);
      const now = new Date();
      setDate(localDateOf(now));
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 1, 0);
      timer = setTimeout(check, nextMidnight.getTime() - now.getTime());
    };
    check();
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && check());
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return addDays(date, dayOffset);
}

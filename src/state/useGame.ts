import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import type { LocalDate } from '@/game/date';
import { computeGame, type DailyTotals, type GameState } from '@/game/game';
import { stepSource } from '@/steps';
import { useSettings } from '@/state/settings';
import { useToday } from '@/time/today';

/** Recomputed from the step source's daily totals on every refresh; nothing derived is stored. */
export function useGame(): GameState | null {
  const today = useToday();
  const goalHistory = useSettings((state) => state.goalHistory);
  const journeyStart = useSettings((state) => state.journeyStart);
  const dailyTotals = useDailyTotals(journeyStart, today);

  return useMemo(
    () =>
      goalHistory && journeyStart && dailyTotals ? computeGame({ today, dailyTotals, goalHistory, journeyStart }) : null,
    [today, dailyTotals, goalHistory, journeyStart],
  );
}

function useDailyTotals(from: LocalDate | null, to: LocalDate): DailyTotals | null {
  const [totals, setTotals] = useState<DailyTotals | null>(null);

  useEffect(() => {
    if (!from) return;
    let latest = 0;
    let live = true;
    const load = () => {
      const request = ++latest;
      stepSource.dailyTotals(from, to).then((result) => {
        if (live && request === latest) setTotals(result);
      });
    };
    load();
    const unsubscribe = stepSource.subscribe(load);
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && load());
    return () => {
      live = false;
      unsubscribe();
      subscription.remove();
    };
  }, [from, to]);

  return totals;
}

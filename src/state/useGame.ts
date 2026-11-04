import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { LocalDate } from '@/game/date';
import { computeGame, type GameState } from '@/game/game';
import { stepSource } from '@/steps';
import { useSettings } from '@/state/settings';
import { useToday } from '@/time/today';

type GameLoad = {
  game: GameState | null;
  /** False once the source has answered and every day since the journey began is empty. */
  hasSteps: boolean;
  /** The source failed and there is nothing to show from an earlier answer. */
  failed: boolean;
  retry: () => void;
};

/** Recomputed from the step source's daily totals on every refresh; nothing derived is stored. */
export function useGame(): GameLoad {
  const today = useToday();
  const goalHistory = useSettings((state) => state.goalHistory);
  const journeyStart = useSettings((state) => state.journeyStart);
  const fetchTotals = useMemo(() => (journeyStart ? () => stepSource.dailyTotals(journeyStart, today) : null), [journeyStart, today]);
  const { data: dailyTotals, failed, retry } = useRefreshed(fetchTotals);

  const game = useMemo(
    () =>
      goalHistory && journeyStart && dailyTotals ? computeGame({ today, dailyTotals, goalHistory, journeyStart }) : null,
    [today, dailyTotals, goalHistory, journeyStart],
  );

  return {
    game,
    hasSteps: !dailyTotals || Object.values(dailyTotals).some((steps) => (steps ?? 0) > 0),
    failed: failed && !game,
    retry,
  };
}

/** Today's steps per local hour, refreshed like the daily totals. */
export function useHourlySteps(date: LocalDate): readonly number[] | null {
  const fetchHours = useMemo(() => () => stepSource.hourlyTotals(date), [date]);
  return useRefreshed(fetchHours).data;
}

/** Fetches now, whenever the source changes and on every return to the foreground. Keeps the last answer if a refresh fails. */
function useRefreshed<T>(fetch: (() => Promise<T>) | null) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  const reload = useRef(() => {});

  useEffect(() => {
    if (!fetch) return;
    let latest = 0;
    let live = true;
    const load = () => {
      const request = ++latest;
      fetch().then(
        (result) => {
          if (!live || request !== latest) return;
          setData(result);
          setFailed(false);
        },
        () => {
          if (live && request === latest) setFailed(true);
        },
      );
    };
    reload.current = load;
    load();
    const unsubscribe = stepSource.subscribe(load);
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && load());
    return () => {
      live = false;
      unsubscribe();
      subscription.remove();
    };
  }, [fetch]);

  const retry = useCallback(() => {
    setFailed(false);
    reload.current();
  }, []);

  return { data, failed, retry };
}

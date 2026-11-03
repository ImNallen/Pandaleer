import { addDays, weekStart, type LocalDate } from './date.ts';

export type DailyTotals = Readonly<Partial<Record<LocalDate, number>>>;

export type GoalChange = { readonly from: LocalDate; readonly goal: number };

/** Sorted by `from`, ascending. The first entry also covers every earlier date. */
export type GoalHistory = readonly [GoalChange, ...GoalChange[]];

export type GameInput = {
  readonly today: LocalDate;
  readonly dailyTotals: DailyTotals;
  readonly goalHistory: GoalHistory;
  readonly journeyStart: LocalDate;
};

export type Day = {
  readonly date: LocalDate;
  readonly steps: number;
  readonly goal: number;
  readonly met: boolean;
};

/** `unknown` is a day before the journey started, so there are no steps to judge. */
export type WeekDayState = 'met' | 'missed' | 'today' | 'upcoming' | 'unknown';

export type WeekDay = Day & { readonly state: WeekDayState };

export type GameState = {
  readonly today: Day;
  /** Goal-met days in a row, ending today if today is met, otherwise yesterday. */
  readonly streak: number;
  /** Monday to Sunday of the current week. */
  readonly week: readonly WeekDay[];
};

export function goalOn(history: GoalHistory, date: LocalDate): number {
  let goal = history[0].goal;
  for (const change of history) {
    if (change.from > date) break;
    goal = change.goal;
  }
  return goal;
}

/** Today's goal replaces any change dated today or later; earlier days keep their goals. */
export function withGoal(history: GoalHistory, today: LocalDate, goal: number): GoalHistory {
  const [first, ...rest] = history.filter((change) => change.from < today);
  if (!first) return [{ from: today, goal }];
  const kept: GoalHistory = [first, ...rest];
  return kept[kept.length - 1].goal === goal ? kept : [...kept, { from: today, goal }];
}

export function computeGame({ today, dailyTotals, goalHistory, journeyStart }: GameInput): GameState {
  const dayOn = (date: LocalDate): Day => {
    const steps = dailyTotals[date] ?? 0;
    const goal = goalOn(goalHistory, date);
    return { date, steps, goal, met: steps >= goal };
  };

  const todayDay = dayOn(today);
  let streak = 0;
  for (let date = addDays(today, -1); date >= journeyStart && dayOn(date).met; date = addDays(date, -1)) streak++;
  if (today >= journeyStart && todayDay.met) streak++;

  const monday = weekStart(today);
  const week = Array.from({ length: 7 }, (_, i): WeekDay => {
    const day = dayOn(addDays(monday, i));
    const state: WeekDayState =
      day.date > today ? 'upcoming' : day.date < journeyStart ? 'unknown' : day.met ? 'met' : day.date === today ? 'today' : 'missed';
    return { ...day, state };
  });

  return { today: todayDay, streak, week };
}

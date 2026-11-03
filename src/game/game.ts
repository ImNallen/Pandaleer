import { addDays, type LocalDate } from './date.ts';

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

export type Pose = 'sleeping' | 'packing' | 'walking' | 'flag';

export type Campfire =
  | { readonly kind: 'unlit' }
  | { readonly kind: 'burning'; readonly days: number; readonly litToday: boolean }
  | { readonly kind: 'embers'; readonly lastStreak: number };

export type Day = {
  readonly date: LocalDate;
  readonly steps: number;
  readonly goal: number;
  readonly met: boolean;
};

export type GameState = {
  readonly today: Day & { readonly pose: Pose };
  readonly campfire: Campfire;
  /** Every day from the journey start through today, oldest first. */
  readonly days: readonly Day[];
};

// Checked top to bottom: the first row where steps >= goal * quarters / 4 wins.
const POSES: readonly { quarters: number; pose: Pose }[] = [
  { quarters: 4, pose: 'flag' },
  { quarters: 2, pose: 'walking' },
  { quarters: 1, pose: 'packing' },
  { quarters: 0, pose: 'sleeping' },
];

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
  const pose = POSES.find((row) => todayDay.steps * 4 >= todayDay.goal * row.quarters)!.pose;

  const days: Day[] = [];
  for (let date = journeyStart; date <= today; date = addDays(date, 1)) days.push(dayOn(date));

  return { today: { ...todayDay, pose }, campfire: campfire(days), days };
}

/** `days` runs oldest to newest and ends with today when today is on the journey. */
function campfire(days: readonly Day[]): Campfire {
  const today = days.at(-1);
  const litToday = today?.met ?? false;
  const past = days.slice(0, -1);

  let run = 0;
  for (let i = past.length - 1; i >= 0 && past[i].met; i--) run++;
  if (run + (litToday ? 1 : 0) > 0) return { kind: 'burning', days: run + (litToday ? 1 : 0), litToday };

  for (let i = past.length - 2; i >= 0; i--) {
    if (!past[i].met) continue;
    let lastStreak = 0;
    for (let k = i; k >= 0 && past[k].met; k--) lastStreak++;
    return { kind: 'embers', lastStreak };
  }
  return { kind: 'unlit' };
}

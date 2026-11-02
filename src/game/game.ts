import { addDays, type LocalDate } from './date.ts';
import type { Expedition } from './expedition.ts';

export type DailyTotals = Readonly<Partial<Record<LocalDate, number>>>;

export type GoalChange = { readonly from: LocalDate; readonly goal: number };

/** Sorted by `from`, ascending. The first entry also covers every earlier date. */
export type GoalHistory = readonly [GoalChange, ...GoalChange[]];

export type GameInput = {
  readonly today: LocalDate;
  readonly dailyTotals: DailyTotals;
  readonly goalHistory: GoalHistory;
  readonly expeditionStart: LocalDate;
};

export type Pose = 'sleeping' | 'packing' | 'walking' | 'flag';

export type Campfire =
  | { readonly kind: 'unlit' }
  | { readonly kind: 'burning'; readonly days: number; readonly litToday: boolean }
  | { readonly kind: 'embers'; readonly lastStreak: number };

export type TrailPosition =
  | {
      readonly kind: 'traveling';
      readonly regionId: string;
      readonly nextCampId: string;
      readonly legSteps: number;
      readonly stepsIntoLeg: number;
      readonly stepsRemaining: number;
    }
  | { readonly kind: 'complete' };

export type GameState = {
  readonly today: {
    readonly date: LocalDate;
    readonly steps: number;
    readonly goal: number;
    readonly goalMet: boolean;
    readonly pose: Pose;
  };
  readonly campfire: Campfire;
  readonly trail: {
    readonly totalSteps: number;
    readonly campsReached: number;
    readonly position: TrailPosition;
  };
  readonly discoveries: readonly string[];
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

export function computeGame(input: GameInput, expedition: Expedition): GameState {
  const { today, dailyTotals, goalHistory, expeditionStart } = input;
  const stepsOn = (date: LocalDate) => dailyTotals[date] ?? 0;
  const metOn = (date: LocalDate) => stepsOn(date) >= goalOn(goalHistory, date);

  const steps = stepsOn(today);
  const goal = goalOn(goalHistory, today);
  const pose = POSES.find((row) => steps * 4 >= goal * row.quarters)!.pose;

  return {
    today: { date: today, steps, goal, goalMet: steps >= goal, pose },
    campfire: campfire(today, expeditionStart, metOn),
    ...trail(totalSteps(dailyTotals, expeditionStart, today), expedition),
  };
}

function totalSteps(dailyTotals: DailyTotals, from: LocalDate, to: LocalDate): number {
  let total = 0;
  for (const [date, steps] of Object.entries(dailyTotals)) {
    if (date >= from && date <= to) total += steps ?? 0;
  }
  return total;
}

function campfire(today: LocalDate, start: LocalDate, metOn: (date: LocalDate) => boolean): Campfire {
  const runEndingOn = (last: LocalDate) => {
    let days = 0;
    for (let date = last; date >= start && metOn(date); date = addDays(date, -1)) days++;
    return days;
  };

  const litToday = today >= start && metOn(today);
  const days = runEndingOn(addDays(today, -1)) + (litToday ? 1 : 0);
  if (days > 0) return { kind: 'burning', days, litToday };

  for (let date = addDays(today, -2); date >= start; date = addDays(date, -1)) {
    if (metOn(date)) return { kind: 'embers', lastStreak: runEndingOn(date) };
  }
  return { kind: 'unlit' };
}

function trail(total: number, expedition: Expedition): Pick<GameState, 'trail' | 'discoveries'> {
  const discoveries: string[] = [];
  let reachedThrough = 0;
  for (const region of expedition.regions) {
    for (const camp of region.camps) {
      const threshold = reachedThrough + camp.stepsFromPrevious;
      if (total < threshold) {
        const stepsIntoLeg = total - reachedThrough;
        return {
          trail: {
            totalSteps: total,
            campsReached: discoveries.length,
            position: {
              kind: 'traveling',
              regionId: region.id,
              nextCampId: camp.id,
              legSteps: camp.stepsFromPrevious,
              stepsIntoLeg,
              stepsRemaining: camp.stepsFromPrevious - stepsIntoLeg,
            },
          },
          discoveries,
        };
      }
      reachedThrough = threshold;
      discoveries.push(camp.discovery.id);
    }
  }
  return { trail: { totalSteps: total, campsReached: discoveries.length, position: { kind: 'complete' } }, discoveries };
}

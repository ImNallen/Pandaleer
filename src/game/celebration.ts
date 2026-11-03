import type { LocalDate } from './date.ts';
import type { GameState } from './game.ts';

/** The latest day whose goal was celebrated. It only moves forward, so a clock that jumps back never repeats one. */
export type GoalCelebratedOn = LocalDate | null;

export function shouldCelebrateGoal(game: GameState, celebratedOn: GoalCelebratedOn): boolean {
  return game.today.met && (celebratedOn === null || game.today.date > celebratedOn);
}

export function acknowledgeGoal(game: GameState, celebratedOn: GoalCelebratedOn): GoalCelebratedOn {
  if (!game.today.met) return celebratedOn;
  return celebratedOn !== null && celebratedOn > game.today.date ? celebratedOn : game.today.date;
}

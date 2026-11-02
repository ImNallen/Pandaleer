import type { LocalDate } from './date.ts';
import type { GameState } from './game.ts';

/** What the player has already been congratulated for. UI bookkeeping, never an input to the game. */
export type CelebrationAcks = {
  /** null until the first run, so progress made before installing is not celebrated. */
  readonly campsSeen: number | null;
  /** The latest day whose goal was celebrated; only moves forward, so a clock that jumps back never repeats one. */
  readonly goalCelebratedOn: LocalDate | null;
};

export type Celebration = {
  /** Discovery ids of camps reached since the last celebration, in trail order. */
  readonly discoveries: readonly string[];
  readonly goal: boolean;
};

export function pendingCelebration(game: GameState, acks: CelebrationAcks): Celebration | null {
  const seen = acks.campsSeen ?? game.trail.campsReached;
  const discoveries = game.discoveries.slice(seen);
  const goal = game.today.goalMet && (acks.goalCelebratedOn === null || game.today.date > acks.goalCelebratedOn);
  return discoveries.length > 0 || goal ? { discoveries, goal } : null;
}

export function acknowledge(game: GameState, acks: CelebrationAcks): CelebrationAcks {
  return {
    campsSeen: Math.max(acks.campsSeen ?? 0, game.trail.campsReached),
    goalCelebratedOn: game.today.goalMet ? later(game.today.date, acks.goalCelebratedOn) : acks.goalCelebratedOn,
  };
}

function later(a: LocalDate, b: LocalDate | null): LocalDate {
  return b !== null && b > a ? b : a;
}

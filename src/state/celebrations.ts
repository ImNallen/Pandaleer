import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { acknowledgeGoal, type GoalCelebratedOn } from '@/game/celebration';
import type { GameState } from '@/game/game';
import { zustandStorage } from '@/storage';

type State = {
  goalCelebratedOn: GoalCelebratedOn;
  /** True while the celebration plays; never persisted. */
  celebrating: boolean;
  celebrate: (game: GameState) => void;
  finish: () => void;
};

export const useCelebrations = create<State>()(
  persist(
    (set, get) => ({
      goalCelebratedOn: null,
      celebrating: false,
      celebrate: (game) => set({ goalCelebratedOn: acknowledgeGoal(game, get().goalCelebratedOn), celebrating: true }),
      finish: () => set({ celebrating: false }),
    }),
    {
      name: 'celebrations',
      version: 2,
      storage: zustandStorage,
      partialize: ({ goalCelebratedOn }) => ({ goalCelebratedOn }),
      migrate: (persisted) => ({ goalCelebratedOn: (persisted as { goalCelebratedOn?: GoalCelebratedOn }).goalCelebratedOn ?? null }),
    },
  ),
);

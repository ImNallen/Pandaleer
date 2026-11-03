import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { acknowledgeGoal, type GoalCelebratedOn } from '@/game/celebration';
import type { GameState } from '@/game/game';
import { zustandStorage } from '@/storage';

type State = { goalCelebratedOn: GoalCelebratedOn; acknowledge: (game: GameState) => void };

export const useCelebrations = create<State>()(
  persist(
    (set, get) => ({
      goalCelebratedOn: null,
      acknowledge: (game) => set({ goalCelebratedOn: acknowledgeGoal(game, get().goalCelebratedOn) }),
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

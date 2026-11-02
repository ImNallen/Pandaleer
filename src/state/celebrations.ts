import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { acknowledge, type CelebrationAcks } from '@/game/celebration';
import type { GameState } from '@/game/game';
import { zustandStorage } from '@/storage';

type Actions = {
  acknowledge: (game: GameState) => void;
  /** After an expedition restart every camp is new again. */
  reset: () => void;
};

export const useCelebrations = create<CelebrationAcks & Actions>()(
  persist(
    (set, get) => ({
      campsSeen: null,
      goalCelebratedOn: null,
      acknowledge: (game) => set(acknowledge(game, get())),
      reset: () => set({ campsSeen: 0, goalCelebratedOn: null }),
    }),
    {
      name: 'celebrations',
      version: 1,
      storage: zustandStorage,
      partialize: ({ campsSeen, goalCelebratedOn }) => ({ campsSeen, goalCelebratedOn }),
    },
  ),
);

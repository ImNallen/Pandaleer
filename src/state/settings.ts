import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { LocalDate } from '@/game/date';
import { withGoal, type GoalHistory } from '@/game/game';
import { zustandStorage } from '@/storage';

export const DEFAULT_GOAL = 6000;

type Settings = {
  goalHistory: GoalHistory | null;
  expeditionStart: LocalDate | null;
};

type SettingsActions = {
  /** Starts the expedition once; later calls are no-ops. */
  begin: (today: LocalDate, goal: number) => void;
  setGoal: (today: LocalDate, goal: number) => void;
  resetExpedition: (today: LocalDate) => void;
};

export const useSettings = create<Settings & SettingsActions>()(
  persist(
    (set) => ({
      goalHistory: null,
      expeditionStart: null,
      begin: (today, goal) =>
        set((state) =>
          state.expeditionStart ? state : { expeditionStart: today, goalHistory: [{ from: today, goal }] },
        ),
      setGoal: (today, goal) =>
        set((state) => ({
          goalHistory: state.goalHistory ? withGoal(state.goalHistory, today, goal) : [{ from: today, goal }],
        })),
      resetExpedition: (today) => set({ expeditionStart: today }),
    }),
    {
      name: 'settings',
      version: 1,
      storage: zustandStorage,
      partialize: ({ goalHistory, expeditionStart }) => ({ goalHistory, expeditionStart }),
    },
  ),
);

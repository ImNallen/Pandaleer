import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { addDays, type LocalDate } from '@/game/date';
import { withGoal, type GoalHistory } from '@/game/game';
import { zustandStorage } from '@/storage';

export const DEFAULT_GOAL = 6000;

/** The map starts with the last week already walked, so it is never empty on day one. */
const PREFILLED_DAYS = 7;

type Settings = {
  goalHistory: GoalHistory | null;
  journeyStart: LocalDate | null;
};

type SettingsActions = {
  /** Starts the journey once; later calls are no-ops. */
  begin: (today: LocalDate, goal: number) => void;
  setGoal: (today: LocalDate, goal: number) => void;
  restartJourney: (today: LocalDate) => void;
};

export const useSettings = create<Settings & SettingsActions>()(
  persist(
    (set) => ({
      goalHistory: null,
      journeyStart: null,
      begin: (today, goal) =>
        set((state) => {
          if (state.journeyStart) return state;
          const journeyStart = addDays(today, 1 - PREFILLED_DAYS);
          return { journeyStart, goalHistory: [{ from: journeyStart, goal }] };
        }),
      setGoal: (today, goal) =>
        set((state) => ({
          goalHistory: state.goalHistory ? withGoal(state.goalHistory, today, goal) : [{ from: today, goal }],
        })),
      restartJourney: (today) => set({ journeyStart: today }),
    }),
    {
      name: 'settings',
      version: 2,
      storage: zustandStorage,
      partialize: ({ goalHistory, journeyStart }) => ({ goalHistory, journeyStart }),
      migrate: (persisted, version) => {
        const state = persisted as { goalHistory: GoalHistory | null; expeditionStart?: LocalDate | null; journeyStart?: LocalDate | null };
        return version < 2 ? { goalHistory: state.goalHistory, journeyStart: state.expeditionStart ?? null } : state;
      },
    },
  ),
);

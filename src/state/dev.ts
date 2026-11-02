import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/storage';

type DevState = {
  /** Shifts "today" so midnight and multi-day streaks can be tried on the Simulator. Ignored in release builds. */
  dayOffset: number;
  shiftDays: (days: number) => void;
  resetClock: () => void;
};

export const useDev = create<DevState>()(
  persist(
    (set) => ({
      dayOffset: 0,
      shiftDays: (days) => set((state) => ({ dayOffset: state.dayOffset + days })),
      resetClock: () => set({ dayOffset: 0 }),
    }),
    { name: 'dev', storage: zustandStorage },
  ),
);

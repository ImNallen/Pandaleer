import type { LocalDate } from '@/game/date';
import type { DailyTotals } from '@/game/game';
import { storage } from '@/storage';

import type { StepSource } from './types';

const TOTALS_KEY = 'mock.dailyTotals';
const ACCESS_KEY = 'mock.accessRequested';
const listeners = new Set<() => void>();

function readTotals(): Record<LocalDate, number> {
  const raw = storage.getString(TOTALS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function writeTotals(totals: Record<LocalDate, number>) {
  storage.set(TOTALS_KEY, JSON.stringify(totals));
  listeners.forEach((listener) => listener());
}

export const mockSteps = {
  stepsOn: (date: LocalDate): number => readTotals()[date] ?? 0,
  add(date: LocalDate, steps: number) {
    const totals = readTotals();
    writeTotals({ ...totals, [date]: Math.max(0, (totals[date] ?? 0) + steps) });
  },
  set(date: LocalDate, steps: number) {
    writeTotals({ ...readTotals(), [date]: Math.max(0, steps) });
  },
  clear() {
    writeTotals({});
    storage.remove(ACCESS_KEY);
  },
};

export const mockStepSource: StepSource = {
  kind: 'mock',
  accessStatus: async () => (storage.getBoolean(ACCESS_KEY) ? 'requested' : 'notDetermined'),
  async requestAccess() {
    storage.set(ACCESS_KEY, true);
    return 'requested';
  },
  async dailyTotals(from, to) {
    const totals: Partial<Record<LocalDate, number>> = {};
    for (const [date, steps] of Object.entries(readTotals()) as [LocalDate, number][]) {
      if (date >= from && date <= to) totals[date] = steps;
    }
    return totals satisfies DailyTotals;
  },
  subscribe(onChange) {
    listeners.add(onChange);
    return () => listeners.delete(onChange);
  },
};

import type { LocalDate } from '@/game/date';
import type { DailyTotals } from '@/game/game';
import { storage } from '@/storage';

import type { StepSource } from './types';

const HOURS_KEY = 'mock.hourly';
const LEGACY_TOTALS_KEY = 'mock.dailyTotals';
const ACCESS_KEY = 'mock.accessRequested';
const listeners = new Set<() => void>();

/** A typical day: quiet nights, a morning walk, lunch and the commute home. */
const DAY_CURVE = [0, 0, 0, 0, 0, 0, 1, 4, 8, 5, 4, 5, 9, 6, 4, 4, 5, 9, 8, 6, 4, 2, 1, 0];

type Hours = Record<LocalDate, number[]>;

function read(): Hours {
  const raw = storage.getString(HOURS_KEY);
  if (raw) return JSON.parse(raw);
  const legacy = storage.getString(LEGACY_TOTALS_KEY);
  if (!legacy) return {};
  const totals: Record<LocalDate, number> = JSON.parse(legacy);
  return Object.fromEntries(Object.entries(totals).map(([date, steps]) => [date, spread(steps, 24)]));
}

function write(hours: Hours) {
  storage.set(HOURS_KEY, JSON.stringify(hours));
  storage.remove(LEGACY_TOTALS_KEY);
  listeners.forEach((listener) => listener());
}

/** Splits `steps` over the hours before `untilHour`, following the day curve, keeping the exact total. */
function spread(steps: number, untilHour: number): number[] {
  const weights = DAY_CURVE.map((w, hour) => (hour < untilHour ? w : 0));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const hours = weights.map((w) => Math.floor((steps * w) / total));
  const peak = weights.indexOf(Math.max(...weights));
  hours[peak] += steps - hours.reduce((a, b) => a + b, 0);
  return hours;
}

const sum = (hours: readonly number[] | undefined) => (hours ?? []).reduce((a, b) => a + b, 0);

export const mockSteps = {
  stepsOn: (date: LocalDate): number => sum(read()[date]),
  /** Adds steps to the given hour, by default the current one. */
  add(date: LocalDate, steps: number, hour = new Date().getHours()) {
    const all = read();
    const hours = [...(all[date] ?? Array<number>(24).fill(0))];
    hours[hour] = Math.max(0, hours[hour] + steps);
    write({ ...all, [date]: hours });
  },
  /** Replaces a day's total, spread over a typical day up to `untilHour`. */
  set(date: LocalDate, steps: number, untilHour = 24) {
    write({ ...read(), [date]: spread(Math.max(0, steps), untilHour) });
  },
  clear() {
    write({});
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
    for (const [date, hours] of Object.entries(read()) as [LocalDate, number[]][]) {
      if (date >= from && date <= to) totals[date] = sum(hours);
    }
    return totals satisfies DailyTotals;
  },
  async hourlyTotals(date) {
    return read()[date] ?? Array<number>(24).fill(0);
  },
  subscribe(onChange) {
    listeners.add(onChange);
    return () => listeners.delete(onChange);
  },
};

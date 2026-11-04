import { localDateOf, type LocalDate } from '../game/date.ts';
import type { DailyTotals } from '../game/game.ts';

/** One interval of a HealthKit statistics collection. */
export type StatisticsRow = {
  readonly startDate?: Date;
  readonly sumQuantity?: { readonly quantity: number };
};

/** Whole steps per local calendar day. Days nobody walked simply stay absent. */
export function dailyTotalsFrom(rows: readonly StatisticsRow[]): DailyTotals {
  const totals: Partial<Record<LocalDate, number>> = {};
  for (const { startDate, sumQuantity } of rows) {
    if (!startDate || !sumQuantity) continue;
    const date = localDateOf(startDate);
    totals[date] = (totals[date] ?? 0) + Math.round(sumQuantity.quantity);
  }
  return totals;
}

/** 24 entries by local hour. When clocks go back, the repeated hour is added together. */
export function hourlyTotalsFrom(rows: readonly StatisticsRow[]): readonly number[] {
  const hours = Array<number>(24).fill(0);
  for (const { startDate, sumQuantity } of rows) {
    if (!startDate || !sumQuantity) continue;
    hours[startDate.getHours()] += Math.round(sumQuantity.quantity);
  }
  return hours;
}

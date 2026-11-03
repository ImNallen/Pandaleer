import type { LocalDate } from '@/game/date';
import type { DailyTotals } from '@/game/game';

/**
 * HealthKit never reveals whether read access was denied, so "requested" covers
 * both granted and denied.
 */
export type HealthAccess = 'notDetermined' | 'requested' | 'unavailable';

export interface StepSource {
  readonly kind: 'mock' | 'healthkit';
  accessStatus(): Promise<HealthAccess>;
  requestAccess(): Promise<HealthAccess>;
  /** Totals per local calendar day in the device's current time zone, `from` and `to` inclusive. */
  dailyTotals(from: LocalDate, to: LocalDate): Promise<DailyTotals>;
  /** 24 entries, steps per local hour of `date`. */
  hourlyTotals(date: LocalDate): Promise<readonly number[]>;
  subscribe(onChange: () => void): () => void;
}

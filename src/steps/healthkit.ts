import {
  AuthorizationRequestStatus,
  getRequestStatusForAuthorization,
  isHealthDataAvailableAsync,
  queryStatisticsCollectionForQuantity,
  requestAuthorization,
  subscribeToChanges,
} from '@kingstinct/react-native-healthkit';

import { addDays, localMidnight, type LocalDate } from '@/game/date';

import { dailyTotalsFrom, hourlyTotalsFrom } from './buckets';
import type { StepSource } from './types';

const STEPS = 'HKQuantityTypeIdentifierStepCount';
const ACCESS = { toRead: [STEPS] } as const;

/** HealthKit merges iPhone and Apple Watch steps in statistics queries, so nothing counts twice. */
function statistics(from: LocalDate, to: LocalDate, interval: { day: number } | { hour: number }) {
  const startDate = localMidnight(from);
  return queryStatisticsCollectionForQuantity(STEPS, ['cumulativeSum'], startDate, interval, {
    unit: 'count',
    filter: { date: { startDate, endDate: localMidnight(addDays(to, 1)) } },
  });
}

export const healthKitStepSource: StepSource = {
  kind: 'healthkit',
  async accessStatus() {
    if (!(await isHealthDataAvailableAsync())) return 'unavailable';
    const status = await getRequestStatusForAuthorization(ACCESS);
    return status === AuthorizationRequestStatus.unnecessary ? 'requested' : 'notDetermined';
  },
  async requestAccess() {
    await requestAuthorization(ACCESS);
    return 'requested';
  },
  async dailyTotals(from, to) {
    return dailyTotalsFrom(await statistics(from, to, { day: 1 }));
  },
  async hourlyTotals(date) {
    return hourlyTotalsFrom(await statistics(date, date, { hour: 1 }));
  },
  subscribe(onChange) {
    const subscription = subscribeToChanges(STEPS, onChange);
    return () => {
      subscription.remove();
    };
  },
};

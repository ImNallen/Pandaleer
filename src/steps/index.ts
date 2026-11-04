import { healthKitStepSource } from './healthkit';
import { mockStepSource } from './mock';
import type { StepSource } from './types';

/**
 * Release builds always read Apple Health. Dev builds use the mock so any day can be tried;
 * start Metro with EXPO_PUBLIC_STEP_SOURCE=healthkit to run them against Apple Health too.
 */
export const stepSource: StepSource =
  __DEV__ && process.env.EXPO_PUBLIC_STEP_SOURCE !== 'healthkit' ? mockStepSource : healthKitStepSource;
export type { HealthAccess, StepSource } from './types';

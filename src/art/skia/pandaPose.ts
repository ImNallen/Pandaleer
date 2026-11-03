export type PandaPose = 'wave' | 'walk' | 'brisk' | 'celebrate';

export function poseForProgress(progress: number): PandaPose {
  if (progress >= 1) return 'celebrate';
  if (progress >= 0.6) return 'brisk';
  if (progress >= 0.25) return 'walk';
  return 'wave';
}

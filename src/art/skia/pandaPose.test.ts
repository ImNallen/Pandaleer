/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { poseForProgress, type PandaPose } from './pandaPose.ts';

test('the mascot changes pose at each progress boundary', () => {
  const cases: { progress: number; pose: PandaPose }[] = [
    { progress: -0.1, pose: 'wave' },
    { progress: 0, pose: 'wave' },
    { progress: 0.24999, pose: 'wave' },
    { progress: 0.25, pose: 'walk' },
    { progress: 0.25001, pose: 'walk' },
    { progress: 0.59999, pose: 'walk' },
    { progress: 0.6, pose: 'brisk' },
    { progress: 0.60001, pose: 'brisk' },
    { progress: 0.99999, pose: 'brisk' },
    { progress: 1, pose: 'celebrate' },
    { progress: 1.00001, pose: 'celebrate' },
    { progress: 2, pose: 'celebrate' },
  ];
  for (const { progress, pose } of cases) assert.equal(poseForProgress(progress), pose, `progress ${progress}`);
});

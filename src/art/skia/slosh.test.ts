/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { sloshStep, STILL, surfaceSlope, type Slosh } from './slosh.ts';

const G = 9.81;
const run = (target: number, seconds: number, from: Slosh = STILL) => {
  const frames: Slosh[] = [from];
  for (let i = 0; i < seconds * 60; i++) frames.push(sloshStep(frames.at(-1)!, target, 1 / 60));
  return frames;
};

describe('surfaceSlope', () => {
  test('held upright, the water is level', () => {
    assert.equal(surfaceSlope(0, -G), 0);
  });

  test('right edge tipped down, the water rises on the right (negative slope on screen)', () => {
    const tilt = 0.3;
    assert.ok(surfaceSlope(G * Math.sin(tilt), -G * Math.cos(tilt)) < 0);
    assert.ok(Math.abs(surfaceSlope(G * Math.sin(tilt), -G * Math.cos(tilt)) + Math.tan(tilt)) < 1e-9);
  });

  test('left edge tipped down, it rises on the left', () => {
    assert.ok(surfaceSlope(-G * 0.3, -G * 0.95) > 0);
  });

  test('flat on a table, or with no sensor, it stays level', () => {
    assert.equal(surfaceSlope(0, 0), 0);
    assert.equal(surfaceSlope(0.2, -0.3), 0);
  });

  test('a hard tilt or an upside-down phone is capped', () => {
    assert.equal(surfaceSlope(G, 0), -0.7);
    assert.equal(surfaceSlope(-G * 0.5, G * 0.8), 0.7);
  });
});

describe('sloshStep', () => {
  test('settles on the new slope', () => {
    const last = run(0.5, 3).at(-1)!;
    assert.ok(Math.abs(last.slope - 0.5) < 0.01, `settled at ${last.slope}`);
  });

  test('swings past the new slope before settling, like water', () => {
    assert.ok(Math.max(...run(0.5, 3).map((s) => s.slope)) > 0.52);
  });

  test('a quick tilt makes waves that calm down', () => {
    const frames = run(0.5, 6);
    assert.ok(Math.max(...frames.map((s) => s.energy)) > 0.1);
    assert.ok(frames.at(-1)!.energy < 0.02);
  });

  test('a long pause between frames does not throw the water', () => {
    const next = sloshStep(STILL, 0.5, 2);
    assert.ok(Math.abs(next.slope) < 0.1);
  });
});

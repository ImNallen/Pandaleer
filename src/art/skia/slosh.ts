/** Steepest the water surface may lean, as rise over run on screen, so it never leaves the panda. */
const MAX_SLOPE = 0.7;
const STIFFNESS = 70;
const DAMPING = 7;

export type Slosh = { slope: number; velocity: number; energy: number };

export const STILL: Slosh = { slope: 0, velocity: 0, energy: 0 };

/**
 * The on-screen slope (dy/dx, y pointing down) of a water surface that stays level with the world.
 * `gx`, `gy` are CoreMotion gravity in device axes: x toward the right edge, y toward the top,
 * so an upright phone reads gy ≈ -9.8. Tilting the right edge down makes the water rise on the
 * right, which is a negative slope on screen.
 */
export function surfaceSlope(gx: number, gy: number): number {
  'worklet';
  const down = -gy;
  if (Math.hypot(gx, down) < 1) return 0;
  if (down < 1) return gx > 0 ? -MAX_SLOPE : gx < 0 ? MAX_SLOPE : 0;
  return Math.max(-MAX_SLOPE, Math.min(MAX_SLOPE, -gx / down)) || 0;
}

/** One frame of a damped spring toward `target`; quick swings leave wave energy that fades away. */
export function sloshStep(state: Slosh, target: number, dt: number): Slosh {
  'worklet';
  const step = Math.min(dt, 1 / 30);
  const acceleration = STIFFNESS * (target - state.slope) - DAMPING * state.velocity;
  const velocity = state.velocity + acceleration * step;
  const slope = state.slope + velocity * step;
  const energy = Math.min(1, state.energy * Math.exp(-2.2 * step) + Math.abs(velocity) * step * 1.5);
  return { slope, velocity, energy };
}

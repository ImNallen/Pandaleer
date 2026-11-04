import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dailyTotalsFrom, hourlyTotalsFrom } from './buckets.ts';

const row = (startDate: Date, quantity?: number) => ({
  startDate,
  sumQuantity: quantity === undefined ? undefined : { quantity },
});

describe('dailyTotalsFrom', () => {
  it('keys whole steps by local calendar day', () => {
    assert.deepEqual(dailyTotalsFrom([row(new Date(2026, 10, 3), 4200.4), row(new Date(2026, 10, 4), 6000.6)]), {
      '2026-11-03': 4200,
      '2026-11-04': 6001,
    });
  });

  it('leaves out days with no samples', () => {
    assert.deepEqual(dailyTotalsFrom([row(new Date(2026, 10, 3))]), {});
  });
});

describe('hourlyTotalsFrom', () => {
  it('always returns 24 hours', () => {
    assert.equal(hourlyTotalsFrom([]).length, 24);
  });

  it('places steps in their local hour', () => {
    const hours = hourlyTotalsFrom([row(new Date(2026, 10, 3, 8), 500), row(new Date(2026, 10, 3, 17), 1200)]);
    assert.equal(hours[8], 500);
    assert.equal(hours[17], 1200);
    assert.equal(hours.reduce((a, b) => a + b, 0), 1700);
  });

  it('adds a repeated hour together', () => {
    const hours = hourlyTotalsFrom([row(new Date(2026, 9, 25, 2), 100), row(new Date(2026, 9, 25, 2), 50)]);
    assert.equal(hours[2], 150);
  });
});

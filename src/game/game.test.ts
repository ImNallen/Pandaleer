/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import { parseLocalDate } from './date.ts';
import { parseExpedition } from './expedition.ts';
import { computeGame, withGoal, type GameInput, type GoalHistory } from './game.ts';

const readJson = (path: string): any => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

describe('computeGame fixtures', () => {
  const expedition = parseExpedition(readJson('./fixtures/expedition.json'));
  for (const fixture of readJson('./fixtures/cases.json').cases) {
    test(fixture.name, () => {
      assert.deepEqual(computeGame(fixture.input as GameInput, expedition), fixture.expected);
    });
  }
});

describe('withGoal', () => {
  const d = parseLocalDate;
  const history: GoalHistory = [{ from: d('2026-03-01'), goal: 6000 }];

  test('appends a change dated today', () => {
    assert.deepEqual(withGoal(history, d('2026-03-10'), 8000), [
      { from: '2026-03-01', goal: 6000 },
      { from: '2026-03-10', goal: 8000 },
    ]);
  });

  test('a second change on the same day replaces the first', () => {
    const once = withGoal(history, d('2026-03-10'), 8000);
    assert.deepEqual(withGoal(once, d('2026-03-10'), 7000), [
      { from: '2026-03-01', goal: 6000 },
      { from: '2026-03-10', goal: 7000 },
    ]);
  });

  test('changing back to the previous goal on the same day leaves no entry for today', () => {
    const once = withGoal(history, d('2026-03-10'), 8000);
    assert.deepEqual(withGoal(once, d('2026-03-10'), 6000), history);
  });

  test('changes dated after today, left by a clock that moved back, are dropped', () => {
    const later = withGoal(history, d('2026-03-12'), 9000);
    assert.deepEqual(withGoal(later, d('2026-03-10'), 8000), [
      { from: '2026-03-01', goal: 6000 },
      { from: '2026-03-10', goal: 8000 },
    ]);
  });
});

describe('content/expedition.json', () => {
  const expedition = parseExpedition(readJson('../../content/expedition.json'));
  const camps = expedition.regions.flatMap((region) => region.camps);

  test('has 12 camps starting 8,000 steps apart and never getting closer', () => {
    assert.equal(camps.length, 12);
    assert.equal(camps[0].stepsFromPrevious, 8000);
    camps.slice(1).forEach((camp, i) => assert.ok(camp.stepsFromPrevious >= camps[i].stepsFromPrevious, camp.id));
  });
});

describe('parseLocalDate', () => {
  test('rejects impossible dates', () => {
    assert.throws(() => parseLocalDate('2026-02-30'));
    assert.throws(() => parseLocalDate('2026-3-1'));
  });
});

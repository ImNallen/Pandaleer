/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import { acknowledgeGoal, shouldCelebrateGoal } from './celebration.ts';
import { parseLocalDate } from './date.ts';
import { computeGame, withGoal, type GameInput, type GoalHistory } from './game.ts';

const readJson = (path: string): any => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

describe('computeGame fixtures', () => {
  for (const fixture of readJson('./fixtures/cases.json').cases) {
    test(fixture.name, () => {
      assert.deepEqual(computeGame(fixture.input as GameInput), fixture.expected);
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

describe('parseLocalDate', () => {
  test('rejects impossible dates', () => {
    assert.throws(() => parseLocalDate('2026-02-30'));
    assert.throws(() => parseLocalDate('2026-3-1'));
  });
});

describe('goal celebrations', () => {
  const d = parseLocalDate;
  const game = (today: string, dailyTotals: Record<string, number>) =>
    computeGame({ today: d(today), dailyTotals, goalHistory: [{ from: d('2026-03-10'), goal: 1000 }], journeyStart: d('2026-03-10') });

  test('celebrates once per day the goal is met', () => {
    const monday = game('2026-03-10', { '2026-03-10': 1200 });
    assert.equal(shouldCelebrateGoal(monday, null), true);
    const acked = acknowledgeGoal(monday, null);
    assert.equal(shouldCelebrateGoal(monday, acked), false);
    assert.equal(shouldCelebrateGoal(game('2026-03-11', { '2026-03-11': 1000 }), acked), true);
  });

  test('not before the goal is met', () => {
    assert.equal(shouldCelebrateGoal(game('2026-03-10', { '2026-03-10': 999 }), null), false);
  });

  test('a goal completed before opening the app remains due until it is acknowledged', () => {
    const completed = game('2026-03-10', { '2026-03-10': 1800 });
    const previousDay = d('2026-03-09');
    assert.equal(shouldCelebrateGoal(completed, previousDay), true);
    assert.equal(shouldCelebrateGoal(completed, previousDay), true);
    const acknowledged = acknowledgeGoal(completed, previousDay);
    assert.equal(shouldCelebrateGoal(completed, acknowledged), false);
  });

  test('step corrections below and back above the goal do not repeat a revealed celebration', () => {
    const acknowledged = acknowledgeGoal(game('2026-03-10', { '2026-03-10': 1000 }), null);
    assert.equal(shouldCelebrateGoal(game('2026-03-10', { '2026-03-10': 900 }), acknowledged), false);
    assert.equal(shouldCelebrateGoal(game('2026-03-10', { '2026-03-10': 1200 }), acknowledged), false);
    assert.equal(shouldCelebrateGoal(game('2026-03-11', { '2026-03-11': 1000 }), acknowledged), true);
  });

  test('changing the same day\'s goal does not repeat a revealed celebration', () => {
    const today = d('2026-03-10');
    const acknowledged = acknowledgeGoal(game(today, { [today]: 1000 }), null);
    for (const goal of [2000, 500]) {
      const revised = computeGame({ today, dailyTotals: { [today]: 1000 }, goalHistory: [{ from: today, goal }], journeyStart: today });
      assert.equal(shouldCelebrateGoal(revised, acknowledged), false);
    }
  });

  test('a date that moves back, like a westward flight, never repeats a celebration', () => {
    const acked = acknowledgeGoal(game('2026-03-11', { '2026-03-11': 1000 }), d('2026-03-10'));
    const backOnMonday = game('2026-03-10', { '2026-03-10': 2000 });
    assert.equal(shouldCelebrateGoal(backOnMonday, acked), false);
    assert.equal(acknowledgeGoal(backOnMonday, acked), '2026-03-11');
  });
});

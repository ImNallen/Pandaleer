/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import { acknowledge, pendingCelebration, type CelebrationAcks } from './celebration.ts';
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

describe('celebrations', () => {
  const expedition = parseExpedition(readJson('./fixtures/expedition.json'));
  const d = parseLocalDate;
  const game = (today: string, dailyTotals: Record<string, number>) =>
    computeGame(
      { today: d(today), dailyTotals, goalHistory: [{ from: d('2026-03-10'), goal: 1000 }], expeditionStart: d('2026-03-10') },
      expedition,
    );

  test('nothing is celebrated retroactively on the first run, except a goal met today', () => {
    const fresh: CelebrationAcks = { campsSeen: null, goalCelebratedOn: null };
    assert.equal(pendingCelebration(game('2026-03-11', { '2026-03-10': 3500 }), fresh), null);
    assert.deepEqual(pendingCelebration(game('2026-03-10', { '2026-03-10': 3500 }), fresh), { discoveries: [], goal: true });
  });

  test('one big day celebrates every camp it passed, once', () => {
    const before = game('2026-03-10', { '2026-03-10': 500 });
    const acks = acknowledge(before, { campsSeen: null, goalCelebratedOn: null });
    const after = game('2026-03-10', { '2026-03-10': 3500 });
    assert.deepEqual(pendingCelebration(after, acks), { discoveries: ['d-a1', 'd-a2'], goal: true });
    assert.equal(pendingCelebration(after, acknowledge(after, acks)), null);
  });

  test('the goal is celebrated again on a new day', () => {
    const monday = game('2026-03-10', { '2026-03-10': 1000 });
    const acks = acknowledge(monday, { campsSeen: 0, goalCelebratedOn: null });
    const tuesday = game('2026-03-11', { '2026-03-10': 1000, '2026-03-11': 1000 });
    assert.deepEqual(pendingCelebration(tuesday, acks), { discoveries: [], goal: true });
  });

  test('a date that moves back, like a westward flight, never repeats a goal celebration', () => {
    const tuesday = game('2026-03-11', { '2026-03-10': 1000, '2026-03-11': 1000 });
    const acks = acknowledge(tuesday, { campsSeen: 0, goalCelebratedOn: d('2026-03-10') });
    const backOnMonday = game('2026-03-10', { '2026-03-10': 2000 });
    assert.equal(pendingCelebration(backOnMonday, acks), null);
    assert.equal(acknowledge(backOnMonday, acks).goalCelebratedOn, '2026-03-11');
  });

  test('losing camps after a time zone change never re-celebrates them', () => {
    const acks: CelebrationAcks = { campsSeen: 2, goalCelebratedOn: d('2026-03-10') };
    const shrunk = game('2026-03-10', { '2026-03-10': 1200 });
    assert.equal(pendingCelebration(shrunk, acks), null);
    assert.equal(acknowledge(shrunk, acks).campsSeen, 2);
  });
});

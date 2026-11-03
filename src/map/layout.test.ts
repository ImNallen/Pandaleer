/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { addDays, parseLocalDate, type LocalDate } from '../game/date.ts';
import type { Day } from '../game/game.ts';
import { boundaryX, groupWeeks, layoutWeek, legLength } from './layout.ts';

const WIDTH = 402;
const days = (from: string, steps: number[]): Day[] =>
  steps.map((count, i) => {
    const date = addDays(parseLocalDate(from), i);
    return { date, steps: count, goal: 6000, met: count >= 6000 };
  });

// 2026-10-28 is a Wednesday; today is Tuesday 2026-11-10.
const journey = days('2026-10-28', [4000, 7000, 0, 9000, 6500, 3000, 12000, 8000, 5000, 0, 6100, 7000, 20000, 2500]);

describe('groupWeeks', () => {
  const weeks = groupWeeks(journey);

  test('weeks run Monday to Sunday, newest first, and the first and current weeks can be partial', () => {
    assert.deepEqual(
      weeks.map((week) => [week.monday, week.days.length, week.startsJourney, week.current]),
      [
        ['2026-11-09', 2, false, true],
        ['2026-11-02', 7, false, false],
        ['2026-10-26', 5, true, false],
      ],
    );
  });
});

describe('layoutWeek', () => {
  const [current, middle, first] = groupWeeks(journey).map((week) => ({ week, layout: layoutWeek(week, WIDTH) }));

  test('the same week always draws the same way', () => {
    assert.deepEqual(layoutWeek(middle.week, WIDTH), middle.layout);
  });

  test('each day is one leg, as long as that day’s steps allow', () => {
    const { stops } = middle.layout;
    for (let i = 1; i < stops.length; i++) {
      assert.ok(Math.abs(stops[i - 1].y - stops[i].y - legLength(stops[i].day.steps)) < 1e-9, stops[i].day.date);
    }
    assert.equal(legLength(0), 64);
    assert.equal(legLength(6000), 168);
    assert.equal(legLength(50000), 300);
  });

  test('neighbouring weeks meet: a finished week leaves where the next one enters', () => {
    const sunday = middle.layout.stops.at(-1)!;
    assert.equal(sunday.x, boundaryX(current.week.monday, WIDTH));
    assert.ok(current.layout.trailPath.startsWith(`M ${boundaryX(current.week.monday, WIDTH).toFixed(1)} ${current.layout.height.toFixed(1)}`));
    assert.ok(middle.layout.trailPath.endsWith(`${boundaryX(current.week.monday, WIDTH).toFixed(1)} 0.0`));
  });

  test('the journey starts at a trailhead', () => {
    assert.notEqual(first.layout.trailhead, null);
    assert.equal(middle.layout.trailhead, null);
  });

  test('walking more today moves only today’s stop; finished days and their scenery stay put', () => {
    const later = { ...current.week, days: current.week.days.map((day, i, all) => (i === all.length - 1 ? { ...day, steps: day.steps + 3000 } : day)) };
    const grown = layoutWeek(later, WIDTH);
    const fromBottom = (layout: typeof grown, i: number) => layout.height - layout.stops[i].y;
    assert.equal(fromBottom(grown, 0), fromBottom(current.layout, 0));
    assert.ok(fromBottom(grown, 1) > fromBottom(current.layout, 1));
  });

  test('no tree, bush or rock sits on a day’s camp', () => {
    for (const { layout } of [current, middle, first]) {
      for (const item of layout.scenery) {
        if (item.kind !== 'scatter') continue;
        const nearest = Math.min(...layout.stops.map((s) => Math.hypot(s.x - item.x, s.y - item.y)));
        assert.ok(nearest > 40, `${item.type} sits on a camp`);
      }
    }
  });

  test('a year of days groups into 53 weeks, oldest last', () => {
    const year: Day[] = days('2025-11-10', Array.from({ length: 366 }, (_, i) => (i * 1237) % 11000));
    const weeks = groupWeeks(year);
    assert.equal(weeks.length, 53);
    assert.equal(weeks.at(-1)!.monday, '2025-11-10' as LocalDate);
  });
});

/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import { parseExpedition } from '../game/expedition.ts';
import { isTerrain, layoutMap, trailPosition, type MapCamp } from './layout.ts';

const expedition = parseExpedition(JSON.parse(readFileSync(new URL('../../content/expedition.json', import.meta.url), 'utf8')));
const camps: MapCamp[] = expedition.regions.flatMap((region) =>
  region.camps.map((camp) => {
    assert.ok(isTerrain(camp.terrain), `unknown terrain "${camp.terrain}" at ${camp.id}`);
    return { campId: camp.id, terrain: camp.terrain, stepsFromPrevious: camp.stepsFromPrevious };
  }),
);

describe('layoutMap', () => {
  const layout = layoutMap(camps, 402, 2026);

  test('the same seed always draws the same map', () => {
    assert.deepEqual(layoutMap(camps, 402, 2026), layout);
    assert.notDeepEqual(layoutMap(camps, 402, 7).scenery, layout.scenery);
  });

  test('the trail climbs: every camp sits above the one before it, inside the map', () => {
    layout.stops.forEach((stop, i) => {
      assert.ok(stop.x > 0 && stop.x < layout.width && stop.y > 0 && stop.y < layout.height, `stop ${i} inside`);
      if (i > 0) assert.ok(stop.y < layout.stops[i - 1].y, `stop ${i} above stop ${i - 1}`);
    });
  });

  test('camps are spaced in proportion to their step distance', () => {
    const gap = (i: number) => layout.stops[i].y - layout.stops[i + 1].y;
    assert.ok(Math.abs(gap(0) / gap(11) - camps[0].stepsFromPrevious / camps[11].stepsFromPrevious) < 1e-9);
  });

  test('no tree, bush or rock is planted on the trail', () => {
    const samples = layout.segments.flatMap((_, i) => Array.from({ length: 50 }, (_, k) => trailPosition(layout, i, k / 49).point));
    for (const item of layout.scenery) {
      if (item.kind !== 'scatter') continue;
      const nearest = Math.min(...samples.map((p) => Math.hypot(p.x - item.x, p.y - item.y)));
      assert.ok(nearest > 30, `${item.type} at ${item.x.toFixed(0)},${item.y.toFixed(0)} is ${nearest.toFixed(1)} from the trail`);
    }
  });

  test('walking further along the trail never moves the panda back', () => {
    let previous = -1;
    for (let segment = 0; segment < layout.segments.length; segment++) {
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        const { walked } = trailPosition(layout, segment, t);
        assert.ok(walked >= previous - 1e-6);
        previous = walked;
      }
    }
    assert.ok(Math.abs(trailPosition(layout, layout.segments.length, 0).walked - layout.trailLength) < 1e-6);
  });
});

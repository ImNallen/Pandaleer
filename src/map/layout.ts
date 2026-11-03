export type Ground = 'groundBamboo' | 'groundMeadow' | 'groundForest' | 'groundRock' | 'groundSnow';
export type ScatterType = 'bamboo' | 'bush' | 'flowers' | 'pine' | 'rock' | 'teaBush' | 'snowPine' | 'snowRock';
type Feature = 'river' | 'terraces' | 'prayerFlags' | 'pools' | 'snowfall';

type TerrainSpec = { ground: Ground; scatter: readonly ScatterType[]; feature?: Feature };

/** Content picks a terrain per camp; this registry turns it into scenery for the leg that leads to that camp. */
export const TERRAINS = {
  bamboo: { ground: 'groundBamboo', scatter: ['bamboo', 'bamboo', 'bush'] },
  meadow: { ground: 'groundMeadow', scatter: ['flowers', 'bush', 'flowers', 'pine'] },
  river: { ground: 'groundMeadow', scatter: ['bush', 'rock', 'flowers'], feature: 'river' },
  tea: { ground: 'groundBamboo', scatter: ['teaBush', 'teaBush', 'bush'], feature: 'terraces' },
  flags: { ground: 'groundMeadow', scatter: ['flowers', 'bush', 'rock'], feature: 'prayerFlags' },
  forest: { ground: 'groundForest', scatter: ['pine', 'pine', 'pine', 'bush'] },
  hotspring: { ground: 'groundRock', scatter: ['rock', 'pine', 'bush'], feature: 'pools' },
  pass: { ground: 'groundRock', scatter: ['rock', 'rock', 'pine'] },
  snow: { ground: 'groundSnow', scatter: ['snowPine', 'snowPine', 'snowRock'], feature: 'snowfall' },
} as const satisfies Record<string, TerrainSpec>;

export type Terrain = keyof typeof TERRAINS;

export const isTerrain = (value: string): value is Terrain => value in TERRAINS;

export type Point = { x: number; y: number };
type Bezier = readonly [Point, Point, Point, Point];

export type MapStop = Point & { campId: string | null; labelSide: -1 | 1 };

export type SceneryItem =
  | { kind: 'mountain'; x: number; y: number; width: number; height: number; snowy: boolean; far: boolean }
  | { kind: 'scatter'; type: ScatterType; x: number; y: number; scale: number; flip: boolean }
  | { kind: 'mist'; x: number; y: number; width: number }
  | { kind: 'river'; d: string; bridge: Point }
  | { kind: 'terraces'; x: number; y: number }
  | { kind: 'prayerFlags'; from: Point; to: Point }
  | { kind: 'pools'; x: number; y: number }
  | { kind: 'snowflake'; x: number; y: number; r: number };

export type MapLayout = {
  width: number;
  height: number;
  /** stops[0] is the trailhead; stops[i + 1] is the i-th camp. */
  stops: MapStop[];
  segments: Bezier[];
  segmentLengths: number[];
  trailPath: string;
  trailLength: number;
  /** Ground colour at the middle of each leg, top to bottom, for a vertical gradient. */
  ground: { y: number; color: Ground }[];
  scenery: SceneryItem[];
};

export type MapCamp = { campId: string; terrain: Terrain; stepsFromPrevious: number };

const PX_PER_STEP = 0.022;
const TOP = 190;
const BOTTOM = 170;
const TRAIL_CLEARANCE = 38;
const LABEL = { width: 150, height: 52, gap: 24 };

export function layoutMap(camps: readonly MapCamp[], width: number, seed: number): MapLayout {
  const random = mulberry32(seed);
  const between = (min: number, max: number) => min + random() * (max - min);

  const trailHeight = camps.reduce((sum, camp) => sum + camp.stepsFromPrevious, 0) * PX_PER_STEP;
  const height = Math.round(TOP + trailHeight + BOTTOM);

  let y = height - BOTTOM;
  const stops: MapStop[] = [{ x: width / 2, y, campId: null, labelSide: 1 }];
  camps.forEach((camp, i) => {
    y -= camp.stepsFromPrevious * PX_PER_STEP;
    const side = i % 2 === 0 ? -1 : 1;
    const x = clamp(width / 2 + side * width * between(0.1, 0.22), 64, width - 64);
    stops.push({ x, y, campId: camp.campId, labelSide: side === -1 ? 1 : -1 });
  });

  const segments = stops.slice(0, -1).map((stop, i): Bezier => catmullRom(stops[i - 1] ?? stop, stop, stops[i + 1], stops[i + 2] ?? stops[i + 1]));
  const segmentLengths = segments.map((segment) => arcLength(segment, 1));
  const trailPath =
    `M ${fmt(stops[0].x)} ${fmt(stops[0].y)} ` +
    segments.map(([, c1, c2, end]) => `C ${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(end.x)} ${fmt(end.y)}`).join(' ');

  const trailSamples = segments.flatMap((segment) => Array.from({ length: 24 }, (_, i) => cubic(segment, i / 23)));
  const labelBoxes = stops.slice(1).map(labelBox);
  const isClear = (p: Point, margin: number) =>
    trailSamples.every((s) => Math.hypot(s.x - p.x, s.y - p.y) > TRAIL_CLEARANCE + margin) &&
    labelBoxes.every((box) => p.x < box.left - margin || p.x > box.right + margin || p.y < box.top - margin || p.y > box.bottom + margin) &&
    stops.every((stop) => Math.hypot(stop.x - p.x, stop.y - p.y) > 44 + margin);
  const trailXAt = (yy: number) => trailSamples.reduce((best, s) => (Math.abs(s.y - yy) < Math.abs(best.y - yy) ? s : best)).x;

  const scenery: SceneryItem[] = [];
  const ground: MapLayout['ground'] = [];

  camps.forEach((camp, i) => {
    const spec: TerrainSpec = TERRAINS[camp.terrain];
    const from = stops[i];
    const to = stops[i + 1];
    const legTop = to.y;
    const legBottom = i === 0 ? height : from.y;
    const altitude = 1 - (to.y - TOP) / trailHeight;
    ground.push({ y: (legTop + from.y) / 2, color: spec.ground });

    for (const edge of [-1, 1] as const) {
      const mountainWidth = between(120, 180);
      scenery.push({
        kind: 'mountain',
        x: edge === -1 ? between(-40, 10) : width - between(-40, 10),
        y: between(legTop + 10, legBottom - 10),
        width: mountainWidth,
        height: between(70, 110) + altitude * 50,
        snowy: altitude > 0.45,
        far: random() < 0.5,
      });
    }

    const count = Math.round((legBottom - legTop) / 11);
    for (let n = 0; n < count; n++) {
      const p = { x: between(14, width - 14), y: between(legTop, legBottom) };
      if (!isClear(p, 0)) continue;
      scenery.push({
        kind: 'scatter',
        type: spec.scatter[Math.floor(random() * spec.scatter.length)],
        x: p.x,
        y: p.y,
        scale: between(0.8, 1.2),
        flip: random() < 0.5,
      });
    }

    const awayFromLabel = to.x - to.labelSide * 92;
    switch (spec.feature) {
      case 'river': {
        const riverY = (to.y + from.y) / 2 + 10;
        scenery.push({ kind: 'river', d: wavePath(riverY, width, between(10, 18)), bridge: { x: trailXAt(riverY), y: riverY } });
        break;
      }
      case 'terraces':
        scenery.push({ kind: 'terraces', x: clamp(awayFromLabel, 50, width - 50), y: to.y + 40 });
        break;
      case 'prayerFlags':
        scenery.push({ kind: 'prayerFlags', from: { x: to.x - 70, y: to.y - 58 }, to: { x: to.x + 70, y: to.y - 70 } });
        break;
      case 'pools':
        scenery.push({ kind: 'pools', x: clamp(awayFromLabel, 50, width - 50), y: to.y + 46 });
        break;
      case 'snowfall':
        for (let n = 0; n < 18; n++) {
          scenery.push({ kind: 'snowflake', x: between(6, width - 6), y: between(legTop - 40, legBottom), r: between(1.5, 3) });
        }
        break;
    }
  });

  for (let mistY = height - 420; mistY > TOP; mistY -= between(480, 620)) {
    scenery.push({ kind: 'mist', x: between(width * 0.2, width * 0.8), y: mistY, width: between(width * 0.7, width * 1.1) });
  }

  return {
    width,
    height,
    stops,
    segments,
    segmentLengths,
    trailPath,
    trailLength: segmentLengths.reduce((a, b) => a + b, 0),
    ground: ground.reverse(),
    scenery: scenery.sort((a, b) => drawOrder(a) - drawOrder(b)),
  };
}

/** Where the panda stands, and how much trail is behind it, `t` of the way along leg `segment`. */
export function trailPosition(layout: MapLayout, segment: number, t: number): { point: Point; walked: number } {
  const index = Math.min(segment, layout.segments.length - 1);
  const along = segment >= layout.segments.length ? 1 : clamp(t, 0, 1);
  const walked = layout.segmentLengths.slice(0, index).reduce((a, b) => a + b, 0) + arcLength(layout.segments[index], along);
  return { point: cubic(layout.segments[index], along), walked };
}

function labelBox(stop: MapStop) {
  const left = stop.labelSide === 1 ? stop.x + LABEL.gap : stop.x - LABEL.gap - LABEL.width;
  return { left, right: left + LABEL.width, top: stop.y - LABEL.height / 2, bottom: stop.y + LABEL.height / 2 };
}

function drawOrder(item: SceneryItem): number {
  switch (item.kind) {
    case 'mountain':
      return (item.far ? -2e5 : -1e5) + item.y;
    case 'river':
    case 'terraces':
    case 'pools':
      return -5e4;
    case 'mist':
      return 2e5 + item.y;
    case 'snowflake':
      return 3e5 + item.y;
    case 'prayerFlags':
      return item.from.y;
    case 'scatter':
      return item.y;
  }
}

function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point): Bezier {
  return [
    p1,
    { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
    { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
    p2,
  ];
}

function cubic([a, b, c, d]: Bezier, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

function arcLength(segment: Bezier, until: number): number {
  const steps = Math.max(1, Math.ceil(32 * until));
  let length = 0;
  let previous = cubic(segment, 0);
  for (let i = 1; i <= steps; i++) {
    const next = cubic(segment, (until * i) / steps);
    length += Math.hypot(next.x - previous.x, next.y - previous.y);
    previous = next;
  }
  return length;
}

function wavePath(y: number, width: number, amplitude: number): string {
  const step = width / 3;
  let d = `M -20 ${fmt(y)}`;
  for (let i = 0; i < 3; i++) {
    const x0 = -20 + i * (step + 14);
    const sign = i % 2 === 0 ? -1 : 1;
    d += ` C ${fmt(x0 + step * 0.35)} ${fmt(y + sign * amplitude)} ${fmt(x0 + step * 0.65)} ${fmt(y + sign * amplitude)} ${fmt(x0 + step + 14)} ${fmt(y)}`;
  }
  return d;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const fmt = (n: number) => n.toFixed(1);

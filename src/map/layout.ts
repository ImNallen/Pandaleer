import { addDays, epochDay, weekStart, type LocalDate } from '../game/date.ts';
import type { Day } from '../game/game.ts';

export type Ground = 'groundBamboo' | 'groundMeadow' | 'groundForest' | 'groundRock' | 'groundSnow';
export type ScatterType = 'bamboo' | 'bush' | 'flowers' | 'pine' | 'rock' | 'teaBush' | 'snowPine' | 'snowRock';
type Feature = 'river' | 'terraces' | 'prayerFlags' | 'pools' | 'snowfall';
type TerrainSpec = { ground: Ground; scatter: readonly ScatterType[]; feature?: Feature };

const TERRAINS = {
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

/** One biome per week, in this order, so the trail travels somewhere new every Monday. */
const WEEKLY_TERRAINS: readonly (keyof typeof TERRAINS)[] = ['bamboo', 'meadow', 'river', 'tea', 'flags', 'forest', 'hotspring', 'pass', 'snow'];

export type Point = { x: number; y: number };
type Bezier = readonly [Point, Point, Point, Point];

export type SceneryItem =
  | { kind: 'mountain'; x: number; y: number; width: number; height: number; snowy: boolean; far: boolean }
  | { kind: 'scatter'; type: ScatterType; x: number; y: number; scale: number; flip: boolean }
  | { kind: 'mist'; x: number; y: number; width: number }
  | { kind: 'river'; d: string; bridge: Point }
  | { kind: 'terraces'; x: number; y: number }
  | { kind: 'prayerFlags'; from: Point; to: Point }
  | { kind: 'pools'; x: number; y: number }
  | { kind: 'snowflake'; x: number; y: number; r: number };

export type Week = {
  monday: LocalDate;
  /** Oldest first; only days on the journey, so the first and current weeks can be partial. */
  days: readonly Day[];
  /** The journey begins inside this week, so the trail starts at a trailhead instead of the week before. */
  startsJourney: boolean;
  /** This week holds today, so the trail ends where the panda is instead of at Sunday's camp. */
  current: boolean;
};

export type DayStop = Point & { day: Day; labelSide: -1 | 1 };

export type WeekLayout = {
  width: number;
  height: number;
  /** One per day, oldest first. The last stop of the current week is where the panda stands. */
  stops: DayStop[];
  trailPath: string;
  trailhead: Point | null;
  banner: Point;
  /** Ground colours top to bottom, for a vertical gradient that blends into last week's biome. */
  ground: { y: number; color: Ground }[];
  scenery: SceneryItem[];
};

const PX_PER_STEP = 0.028;
const LEG = { min: 64, max: 300 };
const EDGE = 44;
const TRAILHEAD_SPACE = 64;
/** Room between a week's start and its Monday camp for the week banner. */
const BANNER_SPACE = 48;
/** Room above the panda for the screen's floating header. */
const CURRENT_TOP_SPACE = 250;
const TRAIL_CLEARANCE = 36;
const LABEL = { width: 150, height: 50, gap: 26 };

export const legLength = (steps: number) => Math.min(LEG.max, Math.max(LEG.min, steps * PX_PER_STEP));

/** Newest week first. Every week runs Monday to Sunday. */
export function groupWeeks(days: readonly Day[]): Week[] {
  const weeks: Week[] = [];
  for (const day of days) {
    const monday = weekStart(day.date);
    const week = weeks.at(-1);
    if (week?.monday === monday) (week.days as Day[]).push(day);
    else weeks.push({ monday, days: [day], startsJourney: weeks.length === 0, current: false });
  }
  const latest = weeks.at(-1);
  if (latest) latest.current = true;
  return weeks.reverse();
}

export function layoutWeek(week: Week, width: number): WeekLayout {
  const legs = week.days.map((day) => legLength(day.steps));
  const total = legs.reduce((a, b) => a + b, 0);
  const bottomSpace = week.startsJourney ? TRAILHEAD_SPACE : BANNER_SPACE - EDGE;
  const topSpace = week.current ? CURRENT_TOP_SPACE : EDGE;
  const height = Math.round(bottomSpace + total + topSpace);

  const entryX = boundaryX(week.monday, width);
  const exitX = boundaryX(addDays(week.monday, 7), width);
  const start: Point = week.startsJourney ? { x: width / 2, y: height - TRAILHEAD_SPACE } : { x: entryX, y: height + EDGE };

  let y = week.startsJourney ? start.y : start.y - BANNER_SPACE;
  const stops: DayStop[] = week.days.map((day, i) => {
    y -= legs[i];
    const isSunday = !week.current && i === week.days.length - 1;
    const x = isSunday ? exitX : dayX(day.date, width);
    return { x, y, day, labelSide: x < width / 2 ? 1 : -1 };
  });

  const path: Point[] = [start, ...stops];
  if (!week.startsJourney) path[0] = { x: entryX, y: height };
  if (!week.current) path.push({ x: exitX, y: 0 });
  const below = { x: path[0].x, y: path[0].y + EDGE };
  const last = path.at(-1)!;
  const above = { x: last.x, y: last.y - EDGE };
  const knots = [below, ...path, above];
  const segments = path.slice(0, -1).map((_, i): Bezier => catmullRom(knots[i], knots[i + 1], knots[i + 2], knots[i + 3]));
  const trailPath =
    `M ${fmt(path[0].x)} ${fmt(path[0].y)} ` +
    segments.map(([, c1, c2, end]) => `C ${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(end.x)} ${fmt(end.y)}`).join(' ');

  const terrain = terrainFor(week.monday);
  const scenery = sceneryFor(week, stops, legs, segments, width, height, terrain);

  return {
    width,
    height,
    stops,
    trailPath,
    trailhead: week.startsJourney ? start : null,
    banner: { x: path[0].x, y: height - 20 },
    ground: [
      { y: 0, color: TERRAINS[terrain].ground },
      { y: height * 0.75, color: TERRAINS[terrain].ground },
      { y: height, color: TERRAINS[week.startsJourney ? terrain : terrainFor(addDays(week.monday, -7))].ground },
    ],
    scenery: scenery.sort((a, b) => drawOrder(a) - drawOrder(b)),
  };
}

function sceneryFor(
  week: Week,
  stops: DayStop[],
  legs: number[],
  segments: Bezier[],
  width: number,
  height: number,
  terrain: keyof typeof TERRAINS,
): SceneryItem[] {
  const spec: TerrainSpec = TERRAINS[terrain];
  const samples = segments.flatMap((segment) => Array.from({ length: 20 }, (_, i) => cubic(segment, i / 19)));
  const boxes = stops.map(labelBox);
  const isClear = (p: Point) =>
    samples.every((s) => Math.hypot(s.x - p.x, s.y - p.y) > TRAIL_CLEARANCE) &&
    boxes.every((box) => p.x < box.left || p.x > box.right || p.y < box.top || p.y > box.bottom) &&
    stops.every((stop) => Math.hypot(stop.x - p.x, stop.y - p.y) > 44);
  const trailXAt = (y: number) => samples.reduce((best, s) => (Math.abs(s.y - y) < Math.abs(best.y - y) ? s : best)).x;

  const scenery: SceneryItem[] = [];
  const featureDay = Math.floor((stops.length - 1) / 2);

  stops.forEach((stop, i) => {
    // Seeded per day and placed relative to the day's own leg, so finished days never change and today's leg only stretches.
    const random = mulberry32(epochDay(stop.day.date) * 2654435761);
    const between = (min: number, max: number) => min + random() * (max - min);
    const legTop = stop.y;
    const legBottom = Math.min(height, stop.y + legs[i]);
    const span = legBottom - legTop;

    const edge = random() < 0.5 ? -1 : 1;
    scenery.push({
      kind: 'mountain',
      x: edge === -1 ? between(-40, 10) : width - between(-40, 10),
      y: legTop + span * between(0.2, 0.9),
      width: between(120, 180),
      height: between(70, 120),
      snowy: terrain === 'snow' || terrain === 'pass',
      far: random() < 0.5,
    });

    for (let n = Math.round(span / 12); n > 0; n--) {
      const p = { x: between(14, width - 14), y: legTop + span * random() };
      const type = spec.scatter[Math.floor(random() * spec.scatter.length)];
      const scale = between(0.8, 1.2);
      const flip = random() < 0.5;
      if (isClear(p)) scenery.push({ kind: 'scatter', type, x: p.x, y: p.y, scale, flip });
    }

    if (spec.feature === 'snowfall') {
      for (let n = Math.round(span / 18); n > 0; n--) {
        scenery.push({ kind: 'snowflake', x: between(6, width - 6), y: legTop + span * random(), r: between(1.5, 3) });
      }
    }

    if (i !== featureDay) return;
    const away = Math.min(width - 50, Math.max(50, stop.x - stop.labelSide * 96));
    switch (spec.feature) {
      case 'river': {
        const riverY = legTop + span * 0.55;
        scenery.push({ kind: 'river', d: wavePath(riverY, width, between(10, 18)), bridge: { x: trailXAt(riverY), y: riverY } });
        break;
      }
      case 'terraces':
        scenery.push({ kind: 'terraces', x: away, y: stop.y + 30 });
        break;
      case 'prayerFlags':
        scenery.push({ kind: 'prayerFlags', from: { x: stop.x - 70, y: stop.y - 58 }, to: { x: stop.x + 70, y: stop.y - 70 } });
        break;
      case 'pools':
        scenery.push({ kind: 'pools', x: away, y: stop.y + 40 });
        break;
    }
  });

  const mist = mulberry32(epochDay(week.monday) * 40503);
  scenery.push({ kind: 'mist', x: width * (0.25 + mist() * 0.5), y: height * (0.3 + mist() * 0.4), width: width * (0.7 + mist() * 0.4) });
  return scenery;
}

function terrainFor(monday: LocalDate): keyof typeof TERRAINS {
  const week = Math.floor(epochDay(monday) / 7);
  return WEEKLY_TERRAINS[((week % WEEKLY_TERRAINS.length) + WEEKLY_TERRAINS.length) % WEEKLY_TERRAINS.length];
}

/** Where the trail crosses from one week into the next; depends only on that Monday, so neighbouring weeks always meet. */
export function boundaryX(monday: LocalDate, width: number): number {
  return width / 2 + (mulberry32(epochDay(monday) * 97)() - 0.5) * width * 0.32;
}

function dayX(date: LocalDate, width: number): number {
  const side = epochDay(date) % 2 === 0 ? -1 : 1;
  return width / 2 + side * width * (0.08 + mulberry32(epochDay(date) * 131)() * 0.14);
}

function labelBox(stop: DayStop) {
  const margin = 14;
  const left = stop.labelSide === 1 ? stop.x + LABEL.gap : stop.x - LABEL.gap - LABEL.width;
  return { left: left - margin, right: left + LABEL.width + margin, top: stop.y - LABEL.height / 2 - margin, bottom: stop.y + LABEL.height / 2 + margin };
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

const fmt = (n: number) => n.toFixed(1);

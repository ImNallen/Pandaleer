import type { Campfire, GameState, Pose } from '@/game/game';

const n = (value: number) => value.toLocaleString();

type Today = GameState['today'];

const TODAY_LINES: Record<Pose, (today: Today) => string> = {
  sleeping: (today) =>
    today.steps === 0 ? 'Zzz… still snug in the tent. A little walk would wake me right up!' : 'Mmh, I hear footsteps… a few more and I will crawl out of my sleeping bag.',
  packing: (today) => `Packing my satchel and checking the map! ${n(today.goal - today.steps)} steps until today's goal.`,
  walking: (today) => `On the trail! Only ${n(today.goal - today.steps)} steps to our goal.`,
  flag: () => 'Goal reached! I planted our flag. Every extra step makes today’s trail longer.',
};

export const todayLine = (today: Today): string => TODAY_LINES[today.pose](today);

export function fireCopy(fire: Campfire, goalMet: boolean): { title: string; detail: string } {
  switch (fire.kind) {
    case 'unlit':
      return { title: 'No campfire yet', detail: 'Reach your daily goal and I will light our very first fire.' };
    case 'burning':
      return {
        title: `${fire.days}-day streak`,
        detail: fire.litToday || goalMet ? 'The fire is crackling. Cozy!' : 'Reach today’s goal to keep the fire burning.',
      };
    case 'embers':
      return {
        title: 'Just embers',
        detail: `Our ${fire.lastStreak}-day fire went out. Reach today’s goal and we will light a new one.`,
      };
  }
}

export function celebrationCopy(fire: Campfire): { title: string; message: string } {
  const message =
    fire.kind === 'burning' && fire.days > 1 ? `${fire.days} days in a row! The campfire burns brighter 🔥` : 'Today’s goal is done. I lit our campfire 🔥';
  return { title: 'Goal reached!', message };
}

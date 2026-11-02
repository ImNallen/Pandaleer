import raw from '../content/expedition.json';
import type { Camp, Discovery, Region } from './game/expedition';
import { parseExpedition } from './game/expedition';

export const expedition = parseExpedition(raw);

export type TrailStop = { region: Region; camp: Camp; discovery: Discovery; index: number };

export const trail: readonly TrailStop[] = expedition.regions.flatMap((region) =>
  region.camps.map((camp) => ({ region, camp, discovery: camp.discovery })),
).map((stop, index) => ({ ...stop, index }));

export const stopByCampId = new Map(trail.map((stop) => [stop.camp.id, stop]));
export const stopByDiscoveryId = new Map(trail.map((stop) => [stop.discovery.id, stop]));

import raw from '../content/expedition.json';
import { parseExpedition } from './game/expedition';

export const expedition = parseExpedition(raw);

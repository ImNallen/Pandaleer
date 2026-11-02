export type Discovery = {
  readonly id: string;
  readonly name: string;
  /** Completes "I found …", e.g. "a snow leopard track". */
  readonly found: string;
  readonly icon: string;
  readonly description: string;
};

export type Camp = {
  readonly id: string;
  readonly name: string;
  readonly stepsFromPrevious: number;
  readonly discovery: Discovery;
};

export type Region = {
  readonly id: string;
  readonly name: string;
  readonly camps: readonly Camp[];
};

export type Expedition = {
  readonly version: 1;
  readonly regions: readonly Region[];
};

export function parseExpedition(raw: unknown): Expedition {
  const root = record(raw, 'expedition');
  if (root.version !== 1) throw new Error(`Unsupported expedition version: ${String(root.version)}`);
  const ids = new Set<string>();
  const unique = (id: string, where: string) => {
    if (ids.has(id)) throw new Error(`Duplicate id "${id}" at ${where}`);
    ids.add(id);
    return id;
  };

  const regions = array(root.regions, 'regions').map((r, ri): Region => {
    const region = record(r, `regions[${ri}]`);
    const where = `regions[${ri}]`;
    const camps = array(region.camps, `${where}.camps`).map((c, ci): Camp => {
      const at = `${where}.camps[${ci}]`;
      const camp = record(c, at);
      const discovery = record(camp.discovery, `${at}.discovery`);
      const steps = camp.stepsFromPrevious;
      if (typeof steps !== 'number' || !Number.isInteger(steps) || steps <= 0) {
        throw new Error(`${at}.stepsFromPrevious must be a positive integer`);
      }
      return {
        id: unique(string(camp.id, `${at}.id`), at),
        name: string(camp.name, `${at}.name`),
        stepsFromPrevious: steps,
        discovery: {
          id: unique(string(discovery.id, `${at}.discovery.id`), `${at}.discovery`),
          name: string(discovery.name, `${at}.discovery.name`),
          found: string(discovery.found, `${at}.discovery.found`),
          icon: string(discovery.icon, `${at}.discovery.icon`),
          description: string(discovery.description, `${at}.discovery.description`),
        },
      };
    });
    if (camps.length === 0) throw new Error(`${where} has no camps`);
    return { id: unique(string(region.id, `${where}.id`), where), name: string(region.name, `${where}.name`), camps };
  });
  if (regions.length === 0) throw new Error('Expedition has no regions');
  return { version: 1, regions };
}

function record(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${where} must be an object`);
  return value as Record<string, unknown>;
}

function array(value: unknown, where: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${where} must be an array`);
  return value;
}

function string(value: unknown, where: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${where} must be a non-empty string`);
  return value;
}

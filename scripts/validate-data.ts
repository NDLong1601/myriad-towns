/**
 * Validates everything under data/:
 *  1. each building file against data/schema/building.schema.json
 *  2. building ids are unique
 *  3. every referenced building id (upgrades.to, decline.to, near/notNear, unlock.buildings) exists
 *  4. every building has a name in every i18n file
 * Exit code 1 on any error, so CI fails.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const dataDir = join(root, 'data');
const errors: string[] = [];

interface Requirement {
  type: string;
  building?: string;
}
interface Building {
  id: string;
  nameKey?: string;
  requires?: Requirement[];
  upgrades?: { to: string; when: Requirement[] }[];
  decline?: { to?: string };
  unlock?: { buildings?: Record<string, number> };
}

const readJson = (path: string): unknown => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`${relative(root, path)}: invalid JSON (${(e as Error).message})`);
    return undefined;
  }
};

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateBuilding = ajv.compile<Building>(
  readJson(join(dataDir, 'schema', 'building.schema.json')) as object,
);

const buildings = new Map<string, string>(); // id → file
const all: Building[] = [];
const buildingDir = join(dataDir, 'buildings');
for (const file of readdirSync(buildingDir)
  .filter((f) => f.endsWith('.json'))
  .sort()) {
  const path = join(buildingDir, file);
  const json = readJson(path);
  if (json === undefined) continue;
  const items = Array.isArray(json) ? json : [json];
  items.forEach((item: unknown, i) => {
    const where = `data/buildings/${file}[${i}]`;
    if (!validateBuilding(item)) {
      for (const err of validateBuilding.errors ?? []) {
        errors.push(`${where}${err.instancePath}: ${err.message ?? 'invalid'}`);
      }
      return;
    }
    if (buildings.has(item.id)) {
      errors.push(`${where}: duplicate id "${item.id}" (also in ${buildings.get(item.id)})`);
    }
    buildings.set(item.id, file);
    all.push(item);
  });
}

for (const b of all) {
  const refs: string[] = [];
  for (const r of b.requires ?? []) if (r.building) refs.push(r.building);
  for (const u of b.upgrades ?? []) {
    refs.push(u.to);
    for (const r of u.when) if (r.building) refs.push(r.building);
  }
  if (b.decline?.to) refs.push(b.decline.to);
  refs.push(...Object.keys(b.unlock?.buildings ?? {}));
  for (const ref of refs) {
    if (!buildings.has(ref)) errors.push(`building "${b.id}": unknown building "${ref}"`);
  }
}

const i18nDir = join(dataDir, 'i18n');
for (const file of readdirSync(i18nDir).filter((f) => f.endsWith('.json'))) {
  const strings = readJson(join(i18nDir, file)) as Record<string, string> | undefined;
  if (!strings) continue;
  for (const b of all) {
    const key = b.nameKey ?? `building.${b.id}.name`;
    if (!strings[key]) errors.push(`data/i18n/${file}: missing "${key}"`);
  }
}

if (errors.length > 0) {
  console.error(`validate-data: ${errors.length} error(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`validate-data: OK (${all.length} buildings)`);

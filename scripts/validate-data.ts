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
  field?: string;
  terrain?: string;
}
interface Building {
  id: string;
  nameKey?: string;
  category: string;
  cost?: Record<string, number>;
  upkeep?: Record<string, number>;
  produces?: Record<string, number>;
  emits?: { field: string }[];
  placeOn?: string[];
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

const resources = readJson(join(dataDir, 'resources.json')) as { stock: string[]; labor: string[] };
const resourceIds = new Set([...resources.stock, ...resources.labor]);
const fieldIds = new Set((readJson(join(dataDir, 'fields.json')) as { fields: string[] }).fields);
const terrainTags = new Set(
  (readJson(join(dataDir, 'terrain-tags.json')) as { tags: string[] }).tags,
);

for (const b of all) {
  for (const [what, amounts] of [
    ['cost', b.cost],
    ['upkeep', b.upkeep],
    ['produces', b.produces],
  ] as const) {
    for (const r of Object.keys(amounts ?? {})) {
      if (!resourceIds.has(r))
        errors.push(`building "${b.id}": unknown resource "${r}" in ${what}`);
    }
  }
  for (const e of b.emits ?? []) {
    if (!fieldIds.has(e.field))
      errors.push(`building "${b.id}": unknown field "${e.field}" in emits`);
  }
  for (const t of b.placeOn ?? []) {
    if (!terrainTags.has(t))
      errors.push(`building "${b.id}": unknown terrain tag "${t}" in placeOn`);
  }
  const allReqs = [...(b.requires ?? []), ...(b.upgrades ?? []).flatMap((u) => u.when)];
  for (const r of allReqs) {
    if (r.field && !fieldIds.has(r.field))
      errors.push(`building "${b.id}": unknown field "${r.field}"`);
    if (r.terrain && !terrainTags.has(r.terrain)) {
      errors.push(`building "${b.id}": unknown terrain tag "${r.terrain}"`);
    }
  }
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

// Packs and chapters (M4): every referenced building/resource exists, ids unique.
interface Goal {
  type: string;
  building?: string;
  resource?: string;
  min: number;
}
const packs =
  (readJson(join(dataDir, 'packs.json')) as { packs: { id: string; buildings: string[] }[] })
    ?.packs ?? [];
const chapters =
  (
    readJson(join(dataDir, 'chapters.json')) as {
      chapters: { id: string; goals: Goal[]; reward?: Record<string, number> }[];
    }
  )?.chapters ?? [];
const packOf = new Map<string, string>();
for (const p of packs) {
  for (const id of p.buildings) {
    if (!buildings.has(id)) errors.push(`pack "${p.id}": unknown building "${id}"`);
    if (packOf.has(id)) errors.push(`building "${id}" is in two packs`);
    packOf.set(id, p.id);
  }
}
const goalTypes = new Set(['population', 'count', 'stock', 'production', 'explore']);
for (const c of chapters) {
  for (const g of c.goals) {
    if (!goalTypes.has(g.type)) errors.push(`chapter "${c.id}": unknown goal type "${g.type}"`);
    if (g.building && !buildings.has(g.building))
      errors.push(`chapter "${c.id}": unknown building "${g.building}"`);
    if (g.resource && !resourceIds.has(g.resource))
      errors.push(`chapter "${c.id}": unknown resource "${g.resource}"`);
  }
  for (const r of Object.keys(c.reward ?? {}))
    if (!resourceIds.has(r)) errors.push(`chapter "${c.id}": unknown reward resource "${r}"`);
}

const i18nDir = join(dataDir, 'i18n');
for (const file of readdirSync(i18nDir).filter((f) => f.endsWith('.json'))) {
  const strings = readJson(join(i18nDir, file)) as Record<string, string> | undefined;
  if (!strings) continue;
  const keys = [
    ...all.map((b) => b.nameKey ?? `building.${b.id}.name`),
    ...new Set(all.map((b) => `category.${b.category}`)),
    ...[...resourceIds].map((r) => `resource.${r}`),
    ...[...fieldIds].map((f) => `field.${f}`),
    ...[...terrainTags].map((t) => `terrain.${t}`),
    ...packs.map((p) => `pack.${p.id}`),
    ...chapters.map((c) => `chapter.${c.id}`),
  ];
  for (const key of keys) {
    if (!strings[key]) errors.push(`data/i18n/${file}: missing "${key}"`);
  }
}

if (errors.length > 0) {
  console.error(`validate-data: ${errors.length} error(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`validate-data: OK (${all.length} buildings)`);

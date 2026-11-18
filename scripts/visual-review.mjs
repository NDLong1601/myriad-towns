import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const [url, out, preset = 'medium'] = process.argv.slice(2);
if (!url || !out || !['low', 'medium', 'high'].includes(preset)) {
  throw new Error(
    'Usage: node scripts/visual-review.mjs <game URL> <output folder> [low|medium|high]',
  );
}
await mkdir(out, { recursive: true });
const software = process.env.MYRIAD_SOFTWARE_GL === '1';
const browser = await chromium.launch({
  args: software ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  const gameUrl = new URL(url);
  gameUrl.search = new URLSearchParams({
    seed: 'nui-song-742',
    mode: 'sandbox',
    free: '1',
    nodecline: '1',
    r: '3',
    audio: '0',
    anim: '0',
    autosave: '0',
    speed: '0',
    quality: preset,
  }).toString();
  await page.goto(gameUrl.href);
  await page.waitForFunction(() => window.__MYRIAD__?.ready(2), null, { timeout: 45_000 });
  const scene = await page.evaluate(async () => {
    const game = window.__MYRIAD__;
    const place = (id, x, z) => game.canPlace(id, x, z) && game.place(id, x, z);
    let docks = 0;
    game.grant({ wood: 9000, stone: 9000, food: 9000 });
    for (let z = -37; z < 0; z++) place('road', -8, z);
    for (let z = -35; z < 0; z++) place('hut', -9, z);
    for (const z of [-27, -25, -24, -22, -20, -18]) {
      if (place('fishing_dock', game.groundY(-5, z) < 2.4 ? -6 : -5, z)) docks++;
    }
    game.tick(40);
    const land = (x, z) => {
      const flags = game.terrainAt(x, z).loadedFlags;
      return flags !== null && !(flags & 1);
    };
    let district = { x: 0, z: 0, score: -1 };
    for (let z = -30; z <= 30; z += 5) {
      for (let x = -42; x <= -20; x += 5) {
        let score = 0;
        for (let dz = -6; dz <= 6; dz += 3)
          for (let dx = -9; dx <= 9; dx += 3) if (land(x + dx, z + dz)) score++;
        score -= Math.hypot(x + 20, z) * 0.05;
        if (score > district.score) district = { x, z, score };
      }
    }
    if (!docks || !(await game.save())) throw new Error('Could not prepare harbor fixture');
    const id = new URLSearchParams(location.search).get('load');
    // Work only in this disposable browser context. Add advanced sample buildings to the
    // actual baseline save so framing does not depend on progression or simulation timing.
    const pending = (req) =>
      new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    const db = await pending(indexedDB.open('myriad-towns'));
    const slot = await pending(db.transaction('saves').objectStore('saves').get(id));
    const payload = await new Response(
      new Blob([slot.bytes]).stream().pipeThrough(new DecompressionStream('gzip')),
    ).json();
    const { x, z } = district;
    payload.camera = { ...payload.camera, x, z, distance: 38 };
    const added = new Set();
    const add = (def, tx, tz, w = 1, d = 1) => {
      for (let dz = 0; dz < d; dz++)
        for (let dx = 0; dx < w; dx++) {
          const px = tx + dx;
          const pz = tz + dz;
          if (!land(px, pz) || added.has(px + ',' + pz) || game.buildingAt(px, pz)) return;
        }
      for (let dz = 0; dz < d; dz++)
        for (let dx = 0; dx < w; dx++) {
          added.add(tx + dx + ',' + (tz + dz));
        }
      let di = payload.defs.indexOf(def);
      if (di < 0) di = payload.defs.push(def) - 1;
      const cx = Math.floor(tx / 32);
      const cz = Math.floor(tz / 32);
      let chunk = payload.chunks.find((record) => record.cx === cx && record.cz === cz);
      if (!chunk) {
        chunk = { cx, cz, b: [] };
        payload.chunks.push(chunk);
      }
      const uid = payload.nextUid++;
      chunk.b.push(uid, di, tx, tz, 3, 0, -1);
      if (def === 'wheat_farm') payload.work.push([uid, 80]);
    };
    for (let dx = -11; dx <= 11; dx++) {
      add('brick_road', x + dx, z);
      add('road', x + dx, z + 6);
    }
    for (let dz = -7; dz <= 7; dz++) add('stone_road', x + 3, z + dz);
    for (let dx = -10; dx <= 8; dx += 3) {
      add('garden_court', x + dx, z - 3, 2, 2);
      add('townhouse', x + dx, z + 1);
      add('market', x + dx + 1, z + 1, 2, 2);
      add('wheat_farm', x + dx, z + 3, 2, 2);
    }
    add('town_hall', x - 2, z - 6, 2, 2);
    add('sawmill', x + 7, z + 4);
    add('lighthouse', -6, -26);
    slot.bytes = new TextEncoder().encode(JSON.stringify(payload));
    const tx = db.transaction('saves', 'readwrite');
    tx.objectStore('saves').put(slot);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return { district: { x, z }, coast: { x: -4.5, z: -24 }, docks };
  });
  await page.reload();
  await page.waitForFunction(() => window.__MYRIAD__?.ready(2), null, { timeout: 45_000 });
  Object.assign(
    scene,
    await page.evaluate(() => {
      const game = window.__MYRIAD__;
      return { buildings: game.buildingCount(), hash: game.hash(), genVersion: game.genVersion };
    }),
  );
  if (scene.buildings < 90) throw new Error(JSON.stringify(scene));
  const report = { preset, software, scene, frames: [] };
  for (const [name, point] of [
    ['district', scene.district],
    ['harbor', scene.coast],
  ]) {
    await page.evaluate(({ x, z }) => window.__MYRIAD__.teleport(x, z), point);
    await page.waitForFunction(() => window.__MYRIAD__?.ready(2), null, { timeout: 30_000 });
    for (const zoom of ['wide', 'close']) {
      if (zoom === 'close') {
        await page.mouse.move(700, 330);
        await page.mouse.wheel(0, -650);
        await page.waitForFunction(() => window.__MYRIAD__.camera().distance < 19);
      }
      for (const [label, t] of [
        ['day', 0.5],
        ['dusk', 0.74],
        ['night', 0.95],
      ]) {
        await page.evaluate((time) => window.__MYRIAD__.timeOfDay(time), t);
        await page.waitForFunction((time) => window.__MYRIAD__.timeOfDay() === time, t);
        await page.screenshot({ path: join(out, `${name}-${zoom}-${label}.png`) });
      }
      const frames = await page.evaluate(async () => {
        const game = window.__MYRIAD__;
        const frame = () => new Promise(requestAnimationFrame);
        const samples = [];
        let previous = await frame();
        for (let i = 0; i < 55; i++) {
          const now = await frame();
          if (i >= 5) samples.push(now - previous);
          previous = now;
        }
        samples.sort((a, b) => a - b);
        const { drawCalls, triangles, renderScale } = game.stats();
        return { p95: samples[47], drawCalls, triangles, renderScale, camera: game.camera() };
      });
      report.frames.push({ name, zoom, ...frames });
    }
    if (name === 'district') {
      await page.mouse.wheel(0, 650);
      await page.waitForFunction(() => window.__MYRIAD__.camera().distance > 37.8);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}

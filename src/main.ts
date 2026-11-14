import './style.css';
import { tileToChunk } from '@/core/coords';
import { seedFromString } from '@/core/prng';
import { GEN_VERSION } from '@/core/version';
import { WorldView } from '@/render/worldView';
import { BIOME_NAMES, type Biome } from '@/world/biomes';
import { InlineGenerator, WorkerPoolGenerator } from '@/world/genPool';
import { sampleTile } from '@/world/terrain';

interface DebugApi {
  seed: number;
  genVersion: number;
  teleport(x: number, z: number): void;
  camera(): { x: number; z: number; distance: number; yaw: number; pitch: number };
  origin(): { x: number; z: number };
  stats(): {
    loaded: number;
    visible: number;
    pending: number;
    generated: number;
    avgGenMs: number;
    meshes: number;
    geometries: number;
    drawCalls: number;
    triangles: number;
  };
  ready(radius?: number): boolean;
}

declare global {
  interface Window {
    /** Set once the first frame is rendered; used by the Playwright smoke test. */
    __MYRIAD_READY__?: { seed: number; genVersion: number };
    /** Debug/testing hooks. Not a public API. */
    __MYRIAD__?: DebugApi;
  }
}

const app = document.getElementById('app');
const hud = document.getElementById('hud');
if (!app || !hud) throw new Error('index.html is missing #app or #hud');

const params = new URLSearchParams(window.location.search);
const seedText = params.get('seed') ?? 'myriad';
const seed = seedFromString(seedText);
const num = (name: string, fallback: number): number => {
  const v = Number(params.get(name));
  return params.has(name) && Number.isFinite(v) ? v : fallback;
};
const small =
  window.matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600;
const viewRadius = Math.max(2, Math.min(10, Math.round(num('r', small ? 4 : 6))));

const generator = typeof Worker !== 'undefined' ? new WorkerPoolGenerator() : new InlineGenerator();
const view = new WorldView(app, {
  seed,
  viewRadius,
  generator,
  start: { x: num('x', 0) + 0.5, z: num('z', 0) + 0.5 },
});

const api: DebugApi = {
  seed,
  genVersion: GEN_VERSION,
  teleport: (x, z) => view.controller.teleport(x, z),
  camera: () => ({ ...view.controller.state }),
  origin: () => ({ x: view.origin.x, z: view.origin.z }),
  stats: () => {
    const info = view.renderer.info;
    return {
      ...view.chunks.stats(),
      meshes: view.terrainMeshCount,
      geometries: info.memory.geometries,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
    };
  },
  ready: (radius) => view.chunks.isReady(radius),
};
window.__MYRIAD__ = api;

// HUD: refreshed a few times per second, not every frame.
let acc = 0;
let frames = 0;
let readySent = false;
view.onFrame((dt) => {
  acc += dt;
  frames++;
  if (!readySent && view.chunks.isReady(1)) {
    readySent = true;
    window.__MYRIAD_READY__ = { seed, genVersion: GEN_VERSION };
    document.body.dataset.ready = 'true';
  }
  if (acc < 0.25) return;
  const fps = Math.round(frames / acc);
  acc = 0;
  frames = 0;
  const s = view.controller.state;
  const tx = Math.floor(s.x);
  const tz = Math.floor(s.z);
  const { cx, cz } = tileToChunk(tx, tz);
  const tile = sampleTile(seed, tx, tz);
  const st = view.chunks.stats();
  hud.innerHTML =
    `<strong>Myriad Towns</strong> · seed "${escapeHtml(seedText)}" · gen v${GEN_VERSION}<br>` +
    `Ô (${tx}, ${tz}) · chunk (${cx}, ${cz}) · ${BIOME_NAMES[tile.biome as Biome]} · cao ${tile.level}<br>` +
    `${fps} fps · ${st.visible}/${st.loaded} chunk · ${view.renderer.info.render.calls} draw call<br>` +
    `<span class="hint">Kéo chuột trái: di chuyển · chuột phải: xoay · cuộn: zoom · Q/E: xoay 90° · WASD</span>`;
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

import './style.css';
import './ui/ui.css';
import { tileToChunk } from '@/core/coords';
import { seedFromString } from '@/core/prng';
import { GEN_VERSION } from '@/core/version';
import { WorldView } from '@/render/worldView';
import { BuildingRenderer } from '@/render/buildingRenderer';
import { PlacementPreview } from '@/render/placementPreview';
import { loadCatalog } from '@/sim/catalog';
import { City } from '@/sim/city';
import { DemolishCommand, History, PlaceCommand } from '@/sim/commands';
import { checkPlacement } from '@/sim/requirements';
import { GeneratedTerrain } from '@/sim/terrainQuery';
import { mountBuildMenu } from '@/ui/buildMenu';
import { BuildTool } from '@/ui/buildTool';
import { mountDebugOverlay } from '@/ui/debugOverlay';
import { mountEncyclopedia } from '@/ui/encyclopedia';
import { mountMinimap } from '@/ui/minimap';
import { parsePreset, qualitySettings } from '@/render/quality';
import { InfoPanel } from '@/ui/infoPanel';
import { mountResourceBar } from '@/ui/resourceBar';
import { HeatmapOverlay } from '@/render/heatmap';
import { PlanRenderer } from '@/render/planRenderer';
import { WARNING_TINT } from '@/render/buildingRenderer';
import { SimClock, SPEEDS, type Speed } from '@/sim/clock';
import { PlanStore } from '@/sim/plan';
import { Simulation } from '@/sim/simulation';
import { mountHeatmapControls } from '@/ui/heatmapControls';
import { mountNotifications } from '@/ui/notifications';
import { mountPlanBar } from '@/ui/planBar';
import { mountSimBar } from '@/ui/simBar';
import { PoiRenderer } from '@/render/poiRenderer';
import { Goals } from '@/sim/goals';
import { PoiStore } from '@/sim/poi';
import { applySandbox, mountGoalsPanel, mountSandboxPanel } from '@/ui/goalsPanel';
import { readSetup, showNewGame } from '@/ui/newGame';
import { t } from '@/ui/i18n';
import { CHUNK_SIZE, localIndex } from '@/core/coords';
import { TileFlag } from '@/world/biomes';
import { LEVEL_HEIGHT, WATER_Y } from '@/world/terrainMesh';
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
    renderScale: number;
    tickMs: number;
    tick: number;
  };
  ready(radius?: number): boolean;
  place(defId: string, x: number, z: number): boolean;
  canPlace(defId: string, x: number, z: number): boolean;
  demolishAt(x: number, z: number): boolean;
  undo(): boolean;
  redo(): boolean;
  buildingCount(): number;
  buildingAt(x: number, z: number): string | null;
  stock(): Record<string, number>;
  /** Testing only: add resources. */
  grant(amounts: Record<string, number>): void;
  /** Run n simulation ticks now (tests). */
  tick(n?: number): number;
  speed(s?: Speed): Speed;
  population(): number;
  /** Status of the building on a tile: active, problems, ticks to a pending decline. */
  statusAt(
    x: number,
    z: number,
  ): { active: boolean; problems: string[]; declineIn: number | null } | null;
  plan(defId: string, x: number, z: number): boolean;
  buildPlan(): number;
  mode(): string;
  goals(): { chapter: string | null; done: boolean[]; pending: readonly string[] | null };
  choosePack(id: string): boolean;
  skipChapter(): void;
  explored(): number;
  poisNear(x: number, z: number): { x: number; z: number; kind: string; explored: boolean }[];
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

const terrain = new GeneratedTerrain(seed);
const city = new City(loadCatalog(), terrain);
const setup = readSetup(params);
const history = new History(city);
const sim = new Simulation(city);
const pois = new PoiStore(city, seed);
const goals = setup.mode === 'goals' ? new Goals(city, sim, pois) : undefined;
if (setup.mode === 'sandbox') applySandbox(setup.sandbox, city, sim);
const clock = new SimClock();
const startSpeed = num('speed', 1);
clock.setSpeed((SPEEDS as readonly number[]).includes(startSpeed) ? (startSpeed as Speed) : 1);
const plans = new PlanStore(city);

const generator = typeof Worker !== 'undefined' ? new WorkerPoolGenerator() : new InlineGenerator();
const view = new WorldView(app, {
  seed,
  viewRadius,
  generator,
  quality: qualitySettings(parsePreset(params.get('quality')) ?? 'medium', window.devicePixelRatio),
  start: { x: num('x', 0) + 0.5, z: num('z', 0) + 0.5 },
  // Cut trees are player edits: re-apply them whenever a chunk is (re)generated.
  patchChunk: (chunk) => {
    let changed = false;
    for (const key of terrain.clearedTrees) {
      const [x, z] = key.split(',').map(Number) as [number, number];
      const lx = x - chunk.cx * CHUNK_SIZE;
      const lz = z - chunk.cz * CHUNK_SIZE;
      if (lx < 0 || lz < 0 || lx >= CHUNK_SIZE || lz >= CHUNK_SIZE) continue;
      const i = localIndex(lx, lz);
      const before = chunk.flags[i] as number;
      chunk.flags[i] = before & ~TileFlag.Tree;
      if (chunk.flags[i] !== before) changed = true;
    }
    return changed;
  },
});

// Buildings stand on the generated surface, so they never depend on a chunk being loaded.
const surfaceY = (x: number, z: number): number => {
  const s = terrain.tile(x, z);
  return s.flags & TileFlag.Water ? WATER_Y : s.level * LEVEL_HEIGHT;
};
const buildings = new BuildingRenderer(city, view.origin, surfaceY);
const preview = new PlacementPreview(view.origin, surfaceY);
const heatmap = new HeatmapOverlay(city, view.origin, surfaceY);
const planView = new PlanRenderer(plans, city.catalog, view.origin, surfaceY);
const poiView = new PoiRenderer(pois, view.origin, surfaceY, viewRadius);
view.scene.add(buildings.group, preview.group, heatmap.group, planView.group, poiView.group);
// Warn visibly on the building itself, not only in a toast.
sim.on((e) => {
  if (e.type === 'warn') buildings.setTint(e.uid, WARNING_TINT);
  else if (e.type === 'resolved' || (e.type === 'declined' && e.to)) buildings.setTint(e.uid, null);
});
city.on((e) => {
  if (e.type === 'trees') view.refreshTiles(e.tiles);
});

mountResourceBar(city, document.body, sim);
const menu = mountBuildMenu(city, history, document.body);
mountEncyclopedia(document.body, city.catalog, menu);
new BuildTool(
  view,
  city,
  history,
  preview,
  new InfoPanel(document.body),
  menu,
  sim,
  plans,
  (x, z) => {
    const poi = poiView.at(x, z);
    return poi ? { poi, explored: pois.isExplored(poi.key) } : undefined;
  },
);
const renderSimBar = mountSimBar(sim, clock, document.body);
mountNotifications(sim, city, document.body, (x, z) => view.controller.teleport(x, z), {
  goals,
  pois,
});

// Left column: the HUD, then the chapter goals (or the Sandbox options).
const left = document.createElement('div');
left.className = 'mt-left';
document.body.appendChild(left);
left.appendChild(hud);
if (goals) mountGoalsPanel(goals, left);
else mountSandboxPanel(setup.sandbox, city, sim, left);
const newGameBtn = document.createElement('button');
newGameBtn.type = 'button';
newGameBtn.className = 'mt-newgame-btn';
newGameBtn.textContent = t('ui.newGameButton');
newGameBtn.addEventListener('click', () => showNewGame(document.body, { seed: seedText }));
newGameBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
left.appendChild(newGameBtn);
if (setup.undecided) showNewGame(document.body, { seed: seedText });
let hudOpen = params.get('debug') === '1';
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyH' && !(e.target instanceof HTMLInputElement)) hudOpen = !hudOpen;
});
mountHeatmapControls(heatmap, document.body);
mountPlanBar(plans, history, document.body);
mountMinimap(document.body, seed, view.controller, city, view);

let simHud = 0;
view.onFrame((dt) => {
  const n = clock.advance(dt);
  if (n > 0) {
    sim.run(n, () => performance.now());
    simHud += n;
    if (simHud >= 2) {
      simHud = 0;
      renderSimBar();
    }
  }
  const s = view.controller.state;
  heatmap.update(s.x, s.z);
  poiView.update(s.x, s.z);
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
      renderScale: view.renderScale,
      tickMs: sim.lastTickMs,
      tick: sim.tick,
    };
  },
  ready: (radius) => view.chunks.isReady(radius),
  place: (defId, x, z) => history.run(new PlaceCommand(defId, x, z)),
  canPlace: (defId, x, z) => checkPlacement(city, city.catalog.get(defId), x, z).ok,
  demolishAt: (x, z) => {
    const b = city.at(x, z);
    return b ? history.run(new DemolishCommand(b.uid)) : false;
  },
  undo: () => history.undo(),
  redo: () => history.redo(),
  buildingCount: () => city.count,
  buildingAt: (x, z) => city.at(x, z)?.def.id ?? null,
  stock: () => ({ ...city.stock }),
  grant: (amounts) => city._addStock(amounts, 1),
  tick: (n = 1) => {
    sim.run(n);
    return sim.tick;
  },
  speed: (s) => {
    if (s !== undefined) clock.setSpeed(s);
    return clock.speed;
  },
  population: () => sim.population,
  statusAt: (x, z) => {
    const b = city.at(x, z);
    if (!b) return null;
    return {
      active: city.isActive(b.uid),
      problems: sim.problemsOf(b.uid).map((p) => (p.kind === 'requirement' ? p.check.key : p.kind)),
      declineIn: sim.declineIn(b.uid) ?? null,
    };
  },
  plan: (defId, x, z) => plans.add(defId, x, z) !== undefined,
  buildPlan: () => plans.build(history),
  mode: () => setup.mode,
  goals: () => ({
    chapter: goals?.current?.id ?? null,
    done: goals?.status().map((g) => g.done) ?? [],
    pending: goals?.pending ?? null,
  }),
  choosePack: (id) => goals?.choose(id) ?? false,
  skipChapter: () => goals?.skip(),
  explored: () => pois.exploredCount,
  poisNear: (x, z) => {
    const c = tileToChunk(Math.floor(x), Math.floor(z));
    return pois.around(c.cx, c.cz, 2).map((p) => ({
      x: p.x,
      z: p.z,
      kind: p.kind,
      explored: pois.isExplored(p.key),
    }));
  },
};
window.__MYRIAD__ = api;
mountDebugOverlay(view.renderer, document.body);

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
  const head = `<strong>Myriad Towns</strong> · seed "${escapeHtml(seedText)}" · ${t(`mode.${setup.mode}`)} · <span class="hint">H: ${t('ui.help')}</span>`;
  if (!hudOpen) {
    hud.innerHTML = head;
    return;
  }
  hud.innerHTML =
    `${head}<br>` +
    `Ô (${tx}, ${tz}) · chunk (${cx}, ${cz}) · ${BIOME_NAMES[tile.biome as Biome]} · cao ${tile.level}<br>` +
    `${fps} fps · tick ${sim.lastTickMs.toFixed(2)} ms · ${st.visible}/${st.loaded} chunk · ${view.renderer.info.render.calls} draw call · ×${view.renderScale.toFixed(2)}<br>` +
    `<span class="hint">Kéo chuột trái: di chuyển · chuột phải: xoay · cuộn: zoom · Q/E: xoay 90°<br>Chọn công trình ở thanh dưới · Esc: huỷ · X: phá · Ctrl+Z: hoàn tác<br>Space: tạm dừng · 1–0: bản đồ nhiệt · P: quy hoạch · B: bách khoa</span>`;
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

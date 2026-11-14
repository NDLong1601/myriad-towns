import './style.css';
import './ui/ui.css';
import { tileToChunk } from '@/core/coords';
import { seedFromString } from '@/core/prng';
import { GEN_VERSION } from '@/core/version';
import { WorldView } from '@/render/worldView';
import { BuildingRenderer } from '@/render/buildingRenderer';
import { TrafficRenderer } from '@/render/trafficRenderer';
import { trafficPlan } from '@/render/trafficPlan';
import { PlacementPreview } from '@/render/placementPreview';
import { isRoadDef, loadCatalog } from '@/sim/catalog';
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
import { DetailPanel } from '@/ui/detailPanel';
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
import { type GameSetup, markTutorialDone, readSetup, showNewGame } from '@/ui/newGame';
import { decodeSave } from '@/io/codec';
import { type SaveData, applySave } from '@/io/save';
import { getSlot, listSlots, storageAvailable } from '@/io/store';
import { SaveSession, showSaveMenu, urlForSlot } from '@/ui/saveMenu';
import { showSettings } from '@/ui/settingsMenu';
import { loadSettings, saveSettings } from '@/ui/settingsStore';
import { TownStore } from '@/sim/towns';
import { TerritoryRenderer } from '@/render/territoryRenderer';
import { mountTownsPanel } from '@/ui/townsPanel';
import { mountTutorial } from '@/ui/tutorial';
import { t } from '@/ui/i18n';
import { initPalette } from '@/ui/palette';
import { AudioEngine } from '@/audio/audioEngine';
import { ambientMix } from '@/audio/ambientMix';
import { timeOfDay } from '@/render/dayNight';
import { CHUNK_SIZE, localIndex } from '@/core/coords';
import { TileFlag } from '@/world/biomes';
import { landY, setFlatTerrain, WATER_Y } from '@/world/terrainMesh';
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
  towns(): {
    id: number;
    x: number;
    z: number;
    population: number;
    radius: number;
    dormant: boolean;
  }[];
  /** Re-evaluates which towns sleep, as if the camera were at (x, z). */
  updateTiers(): void;
  tutorialStep(): string | null;
  /** Time of day 0..1 (null when day/night is off); setting it fixes the clock (for screenshots). */
  timeOfDay(fixed?: number | null): number | null;
  /** Ground height (world units) at a tile. */
  groundY(x: number, z: number): number;
  /** Pedestrians and vehicles currently walking or driving. */
  traffic(): { pedestrians: number; vehicles: number; wantPedestrians: number };
  audio(): { started: boolean; muted: boolean; volume: number; popping: number };
  /** Deterministic state hash (saves round-trip to the same value). */
  hash(): number;
  save(): Promise<boolean>;
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
const settings = loadSettings();
initPalette(params.get('palette'));
// ?load=<slot> continues a saved game: its seed and mode come from the save.
const loadId = params.get('load');
let loaded: SaveData | undefined;
let loadError = false;
if (loadId && storageAvailable()) {
  try {
    const rec = await getSlot(loadId);
    if (rec) loaded = await decodeSave(rec.bytes);
    else loadError = true;
  } catch (e) {
    console.warn('could not load save', e);
    loadError = true;
  }
}
const seedText = loaded?.meta.seed ?? params.get('seed') ?? 'myriad';
const seed = seedFromString(seedText);
const num = (name: string, fallback: number): number => {
  const v = Number(params.get(name));
  return params.has(name) && Number.isFinite(v) ? v : fallback;
};
const small =
  window.matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600;
const viewRadius = Math.max(
  2,
  Math.min(10, Math.round(num('r', settings.radius ?? (small ? 4 : 6)))),
);

const terrain = new GeneratedTerrain(seed);
const city = new City(loadCatalog(), terrain);
const setup: GameSetup = loaded
  ? { mode: loaded.meta.mode, sandbox: loaded.meta.sandbox, undecided: false, tutorial: false }
  : readSetup(params);
const history = new History(city);
const sim = new Simulation(city);
const pois = new PoiStore(city, seed);
const towns = new TownStore(city);
towns.enforceTerritory = setup.mode === 'goals';
// ?tiers=0 keeps every town fully simulated (for comparisons).
const tiersOn = params.get('tiers') !== '0';
sim.tiers = towns;
const goals = setup.mode === 'goals' ? new Goals(city, sim, pois) : undefined;
if (goals) goals.townCount = () => towns.all().length;
if (setup.mode === 'sandbox') {
  applySandbox(setup.sandbox, city, sim);
  if (!loaded) city._addStock({ charter: 3 }, 1);
}
const clock = new SimClock();
const startSpeed = num('speed', 1);
clock.setSpeed((SPEEDS as readonly number[]).includes(startSpeed) ? (startSpeed as Speed) : 1);
const plans = new PlanStore(city);

// Land is drawn flat unless ?terrain=hills (or the setting) asks for the old stepped hills.
const flatTerrain = params.has('terrain')
  ? params.get('terrain') !== 'hills'
  : settings.flatTerrain;
setFlatTerrain(flatTerrain);
const generator =
  typeof Worker !== 'undefined' ? new WorkerPoolGenerator(flatTerrain) : new InlineGenerator();
const view = new WorldView(app, {
  seed,
  viewRadius,
  generator,
  quality: qualitySettings(
    parsePreset(params.get('quality')) ?? settings.quality ?? 'medium',
    window.devicePixelRatio,
  ),
  start: loaded?.camera ?? { x: num('x', 0) + 0.5, z: num('z', 0) + 0.5 },
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
  return s.flags & TileFlag.Water ? WATER_Y : landY(s.level);
};
const buildings = new BuildingRenderer(city, view.origin, surfaceY);
// ?anim=0 turns the placement "pop" off (tests, screenshots).
buildings.animate = params.get('anim') !== '0';
// People and vehicles on the roads (?traffic=0 or the settings toggle turns them off).
const traffic = new TrafficRenderer(city, view.origin, surfaceY, small ? 60 : 160);
traffic.enabled = params.has('traffic') ? params.get('traffic') !== '0' : settings.traffic;
const preview = new PlacementPreview(view.origin, surfaceY);
const heatmap = new HeatmapOverlay(city, view.origin, surfaceY);
const planView = new PlanRenderer(plans, city.catalog, view.origin, surfaceY);
const poiView = new PoiRenderer(pois, view.origin, surfaceY, viewRadius);
const territory = new TerritoryRenderer(towns, view.origin, surfaceY);
view.scene.add(
  buildings.group,
  traffic.group,
  preview.group,
  heatmap.group,
  planView.group,
  poiView.group,
  territory.group,
);
// Restore a saved game now that every system and renderer is listening.
let missingDefs: string[] = [];
if (loaded) missingDefs = applySave({ city, sim, towns, pois, goals }, loaded).missing;
// Warn visibly on the building itself, not only in a toast.
sim.on((e) => {
  if (e.type === 'warn') buildings.setTint(e.uid, WARNING_TINT);
  else if (e.type === 'resolved' || (e.type === 'declined' && e.to)) buildings.setTint(e.uid, null);
});
city.on((e) => {
  if (e.type === 'trees') view.refreshTiles(e.tiles);
});

// Sound: synthesised, starts on the first click or key press (?audio=0 keeps it off).
const audio = new AudioEngine({ volume: settings.volume, muted: settings.muted });
if (params.get('audio') !== '0') audio.attach(window);
/** True while the simulation runs: its replacements are not the player's clicks. */
let simRunning = false;
city.on((e) => {
  if (simRunning) return;
  if (e.type === 'added') audio.play(isRoadDef(e.building.def) ? 'road' : 'place');
  else if (e.type === 'removed' && !city.get(e.building.uid)) audio.play('demolish');
});
history.onRejected(() => audio.play('error'));
sim.on((e) => {
  if (e.type === 'upgraded' && !isRoadDef(city.catalog.get(e.from))) audio.play('upgrade');
  else if (e.type === 'declined') audio.play('decline');
});
goals?.on((e) => {
  if (e.type === 'chapterDone') audio.play('chapter');
});
towns.on((e) => {
  if (e.type === 'founded' && e.town.id > 1) audio.play('chapter');
});
pois.on(() => audio.play('upgrade'));

// Day and night follow game time (?daynight=0 turns it off, ?time=0..1 fixes the hour).
const dayNightOn = params.has('daynight') ? params.get('daynight') !== '0' : settings.dayNight;
let fixedTime: number | null = params.has('time') ? num('time', 0.5) : null;

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
  new DetailPanel(document.body),
);
const renderSimBar = mountSimBar(sim, clock, document.body);
const say = mountNotifications(sim, city, document.body, (x, z) => view.controller.teleport(x, z), {
  goals,
  pois,
  towns,
});

// Left column: the HUD, then the chapter goals (or the Sandbox options).
const left = document.createElement('div');
left.className = 'mt-left';
document.body.appendChild(left);
left.appendChild(hud);
if (goals) mountGoalsPanel(goals, left);
else mountSandboxPanel(setup.sandbox, city, sim, left);
const renderTowns = mountTownsPanel(towns, sim, left, (x, z) => view.controller.teleport(x, z));
towns.on((e) => {
  if (e.type === 'removed') sim.setDormant(e.town.id, false);
});
const tutorial = setup.tutorial
  ? mountTutorial(
      left,
      left.children[1] ?? null,
      city,
      () => view.controller.state,
      () => {
        markTutorialDone();
        const q = new URLSearchParams(window.location.search);
        q.delete('tut');
        history_replace(q);
      },
    )
  : undefined;
const newGameBtn = document.createElement('button');
newGameBtn.type = 'button';
newGameBtn.className = 'mt-newgame-btn';
newGameBtn.textContent = t('ui.newGameButton');
newGameBtn.addEventListener('click', () => {
  // Keep the current game before starting another.
  void session.save(true);
  showNewGame(document.body, { seed: seedText });
});
newGameBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

// Saves: this game's slot (the loaded one, or a new one on first save).
const session = new SaveSession(
  { city, sim, towns, pois, goals },
  loaded?.meta ?? {
    name: seedText,
    mode: setup.mode,
    seed: seedText,
    sandbox: { ...setup.sandbox },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  () => ({ ...view.controller.state }),
  say,
  loaded ? (loadId ?? undefined) : undefined,
);
if (settings.autosave && params.get('autosave') !== '0') session.startAutosave(120);
if (loadError) say(t('save.loadFailed'), 'bad');
if (loaded) say(t('save.loaded', { name: loaded.meta.name }));
if (missingDefs.length) say(t('save.missing', { ids: missingDefs.join(', ') }), 'bad');
if (loaded && loaded.genVersion !== GEN_VERSION) say(t('save.genVersion'), 'bad');

const bar = document.createElement('div');
bar.className = 'mt-left-buttons';
bar.addEventListener('pointerdown', (e) => e.stopPropagation());
const button = (label: string, title: string, onClick: () => void): void => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'mt-newgame-btn';
  b.textContent = label;
  b.title = title;
  b.addEventListener('click', onClick);
  bar.appendChild(b);
};
bar.appendChild(newGameBtn);
button(`💾 ${t('save.button')}`, `${t('save.title')} (Ctrl+S)`, () =>
  showSaveMenu(document.body, session),
);
const muteLabel = (): string => (audio.muted ? '🔇' : '🔊');
button(muteLabel(), t('audio.muteShort'), () => {
  audio.muted = !audio.muted;
  muteBtn.textContent = muteLabel();
  muteBtn.setAttribute('aria-pressed', String(audio.muted));
  saveSettings({ ...loadSettings(), muted: audio.muted });
});
const muteBtn = bar.lastElementChild as HTMLButtonElement;
muteBtn.classList.add('mt-mute');
muteBtn.setAttribute('aria-pressed', String(audio.muted));
button('⚙', t('settings.title'), () =>
  showSettings(
    document.body,
    () => {
      // Reload into this game's slot; if saving is impossible, reload as it is.
      void session
        .save(true)
        .then((ok) =>
          window.location.assign(ok ? urlForSlot(session.slotId) : window.location.href),
        );
    },
    (v) => {
      audio.volume = v;
    },
  ),
);
left.appendChild(bar);
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
    e.preventDefault();
    void session.save();
  }
});
if (setup.undecided) {
  // Offer to continue the most recent game, if this browser has one.
  const latest = storageAvailable() ? await listSlots().catch(() => []) : [];
  showNewGame(document.body, {
    seed: seedText,
    continueSlot: latest[0] ? { name: latest[0].name, url: urlForSlot(latest[0].id) } : undefined,
  });
}
let hudOpen = params.get('debug') === '1';
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyH' && !(e.target instanceof HTMLInputElement)) hudOpen = !hudOpen;
});
const savePanel = (key: 'showMinimap' | 'showHeatmap') => (open: boolean) =>
  saveSettings({ ...loadSettings(), [key]: open });
mountHeatmapControls(heatmap, document.body, {
  open: settings.showHeatmap,
  onToggle: savePanel('showHeatmap'),
});
mountPlanBar(plans, history, document.body);
mountMinimap(document.body, seed, view.controller, city, view, {
  open: params.has('minimap') ? params.get('minimap') !== '0' : settings.showMinimap && !small,
  onToggle: savePanel('showMinimap'),
});

/** Towns far from the camera sleep: a production summary instead of the full tick. */
const DORMANT_DISTANCE = 96;
function updateTiers(): void {
  const c = view.controller.state;
  for (const tw of towns.all()) {
    const away = Math.hypot(tw.x - c.x, tw.z - c.z) - towns.radiusOf(tw);
    sim.setDormant(tw.id, tiersOn && away > DORMANT_DISTANCE);
  }
  renderTowns();
}
let tierClock = 0;

/** What the camera hears: water, trees and buildings around its target, and the hour. */
function sampleSurroundings(): void {
  const c = view.controller.state;
  let water = 0;
  let trees = 0;
  let n = 0;
  for (let dz = -24; dz <= 24; dz += 4) {
    for (let dx = -24; dx <= 24; dx += 4) {
      const f = view.tileFlagsAt(c.x + dx, c.z + dz);
      if (f === undefined) continue;
      n++;
      if (f & TileFlag.Water) water++;
      if (f & TileFlag.Tree) trees++;
    }
  }
  const near = city.near({ x: Math.floor(c.x), z: Math.floor(c.z), w: 1, d: 1 }, 24).length;
  audio.setAmbient(
    ambientMix({
      night: view.nightness,
      water: n ? water / n : 0,
      trees: n ? trees / n : 0,
      buildings: near,
      distance: c.distance,
    }),
  );
}
let ambientClock = 0;
let trafficClock = 1;
/** Population of the town nearest to the camera: that is who is out on the streets. */
function localPopulation(x: number, z: number): number {
  let best = 0;
  let bestD = Infinity;
  for (const tw of towns.all()) {
    const d = Math.hypot(tw.x - x, tw.z - z);
    if (d < bestD) {
      bestD = d;
      best = tw.population;
    }
  }
  return towns.all().length > 0 ? best : sim.population;
}
function refreshTrafficPlan(x: number, z: number): void {
  const roads = city.countTag('road');
  const paved = roads > 0 ? (city.countOf('stone_road') + city.countOf('brick_road')) / roads : 0;
  traffic.setPlan(trafficPlan(localPopulation(x, z), paved, small ? 60 : 160));
}

let simHud = 0;
view.onFrame((dt) => {
  tierClock += dt;
  if (tierClock >= 1) {
    tierClock = 0;
    updateTiers();
  }
  const n = clock.advance(dt);
  if (n > 0) {
    simRunning = true;
    try {
      sim.run(n, () => performance.now());
    } finally {
      simRunning = false;
    }
    simHud += n;
    if (simHud >= 2) {
      simHud = 0;
      renderSimBar();
    }
  }
  const s = view.controller.state;
  heatmap.update(s.x, s.z);
  poiView.update(s.x, s.z);
  buildings.update(dt);
  trafficClock += dt;
  if (trafficClock >= 1) {
    trafficClock = 0;
    refreshTrafficPlan(s.x, s.z);
  }
  traffic.update(dt, s, Math.min(60, Math.max(24, s.distance * 0.9 + 16)), clock.speed === 0);
  if (dayNightOn || fixedTime !== null) view.setTimeOfDay(fixedTime ?? timeOfDay(sim.tick));
  buildings.setNight(view.nightness);
  if (audio.started) {
    audio.update(dt);
    ambientClock += dt;
    if (ambientClock >= 0.5) {
      ambientClock = 0;
      sampleSurroundings();
    }
  }
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
    simRunning = true;
    try {
      sim.run(n);
    } finally {
      simRunning = false;
    }
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
  towns: () =>
    towns.all().map((tw) => ({
      id: tw.id,
      x: tw.x,
      z: tw.z,
      population: tw.population,
      radius: towns.radiusOf(tw),
      dormant: sim.isDormant(tw.id),
    })),
  updateTiers,
  tutorialStep: () => tutorial?.step() ?? null,
  timeOfDay: (fixed) => {
    if (fixed !== undefined) {
      fixedTime = fixed;
      if (fixed === null && !dayNightOn) view.setTimeOfDay(null);
    }
    return view.timeOfDay;
  },
  groundY: (x, z) => surfaceY(x, z),
  traffic: () => ({ ...traffic.counts, wantPedestrians: traffic.planned.pedestrians }),
  audio: () => ({
    started: audio.started,
    muted: audio.muted,
    volume: audio.volume,
    popping: buildings.popping,
  }),
  hash: () => sim.hash(),
  save: () => session.save(),
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

function history_replace(q: URLSearchParams): void {
  const qs = q.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

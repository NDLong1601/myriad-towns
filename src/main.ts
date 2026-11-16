import { tileToChunk } from '@/core/coords';
import { seedFromString } from '@/core/prng';
import { GEN_VERSION } from '@/core/version';
import { WorldView } from '@/render/worldView';
import { BuildingRenderer } from '@/render/buildingRenderer';
import { TrafficRenderer } from '@/render/trafficRenderer';
import { FacilityTraffic } from '@/render/facilityTraffic';
import { trafficPlan } from '@/render/trafficPlan';
import { PlacementPreview } from '@/render/placementPreview';
import { isRoadDef, loadCatalog } from '@/sim/catalog';
import { City } from '@/sim/city';
import { DemolishCommand, History, PlaceCommand } from '@/sim/commands';
import { checkPlacement } from '@/sim/requirements';
import { GeneratedTerrain, tileKey } from '@/sim/terrainQuery';
import { mountBuildMenu } from '@/ui/buildMenu';
import { BuildTool } from '@/ui/buildTool';
import { mountDebugOverlay } from '@/ui/debugOverlay';
import { mountEncyclopedia } from '@/ui/encyclopedia';
import { mountPolicyMenu } from '@/ui/policyMenu';
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
import { initialStockMultiplier, startingTile } from '@/ui/gameStart';
import { mountLighting, showSessionMenu, type LightingMode } from '@/ui/sessionControls';
import { decodeSave } from '@/io/codec';
import { type SaveData, applySave } from '@/io/save';
import { getSlot, storageAvailable } from '@/io/store';
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
import { hasDepositModel, landY, setFlatTerrain, WATER_Y } from '@/world/terrainMesh';
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
  /** Resource and visual flags of the loaded tile for terrain diagnostics. */
  terrainAt(x: number, z: number): { resource: number; loadedFlags: number | null };
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
const cityName = loaded?.meta.name ?? (params.get('city')?.trim().slice(0, 40) || seedText);
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
if (!loaded) {
  const multiplier = initialStockMultiplier(params.get('supplies'));
  if (multiplier !== 1) {
    city._addStock(
      Object.fromEntries(
        Object.entries(city.stock).map(([resource, n]) => [
          resource,
          Math.round(n * multiplier) - n,
        ]),
      ),
      1,
    );
  }
}
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
const originTile =
  loaded || params.has('x') || params.has('z')
    ? { x: 0, z: 0 }
    : startingTile(seed, params.get('area'));
const view = new WorldView(app, {
  seed,
  viewRadius,
  generator,
  quality: qualitySettings(
    parsePreset(params.get('quality')) ?? settings.quality ?? 'medium',
    window.devicePixelRatio,
  ),
  start: loaded?.camera ?? {
    x: num('x', originTile.x) + 0.5,
    z: num('z', originTile.z) + 0.5,
    ...(params.has('area') ? { distance: 38 } : {}),
  },
  // Apply persistent tree edits and hide surface decorations underneath buildings.
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
    const x = chunk.cx * CHUNK_SIZE;
    const z = chunk.cz * CHUNK_SIZE;
    for (const b of city.near({ x, z, w: CHUNK_SIZE, d: CHUNK_SIZE }, 0)) {
      for (
        let tz = Math.max(z, b.z);
        tz < Math.min(z + CHUNK_SIZE, b.z + b.def.footprint.d);
        tz++
      ) {
        for (
          let tx = Math.max(x, b.x);
          tx < Math.min(x + CHUNK_SIZE, b.x + b.def.footprint.w);
          tx++
        ) {
          const i = localIndex(tx - x, tz - z);
          const flags = chunk.flags[i] as number;
          if (
            !(flags & (TileFlag.Covered | TileFlag.Water)) &&
            (flags & (TileFlag.Rock | TileFlag.Tree) ||
              hasDepositModel(chunk.resource[i] as number))
          ) {
            chunk.flags[i] = flags | TileFlag.Covered;
            changed = true;
          }
        }
      }
    }
    return changed;
  },
});

// Buildings stand on the generated surface, so they never depend on a chunk being loaded.
const surfaceY = (x: number, z: number): number => {
  const s = terrain.tile(x, z);
  return s.flags & TileFlag.Water ? WATER_Y : landY(s.level);
};
const buildings = new BuildingRenderer(city, view.origin, surfaceY, (uid) => sim.cropStageOf(uid));
// ?anim=0 turns the placement "pop" off (tests, screenshots).
buildings.animate = params.get('anim') !== '0';
// People and vehicles on the roads (?traffic=0 or the settings toggle turns them off).
const traffic = new TrafficRenderer(city, view.origin, surfaceY, small ? 60 : 160);
const facilityTraffic = new FacilityTraffic(city, view.origin, surfaceY, small ? 6 : 16, sim);
traffic.enabled = params.has('traffic') ? params.get('traffic') !== '0' : settings.traffic;
const preview = new PlacementPreview(view.origin, surfaceY);
const heatmap = new HeatmapOverlay(city, view.origin, surfaceY);
const planView = new PlanRenderer(plans, city.catalog, view.origin, surfaceY);
const poiView = new PoiRenderer(pois, view.origin, surfaceY, viewRadius);
const territory = new TerritoryRenderer(towns, view.origin, surfaceY);
view.scene.add(
  buildings.group,
  traffic.group,
  facilityTraffic.group,
  preview.group,
  heatmap.group,
  planView.group,
  poiView.group,
  territory.group,
);
// One remesh per touched chunk, even when the user draws an entire road at once.
const terrainRefresh = new Map<string, { x: number; z: number }>();
const refreshTerrainAt = (x: number, z: number): void => {
  if (terrainRefresh.size === 0) {
    queueMicrotask(() => {
      view.refreshTiles([...terrainRefresh.values()]);
      terrainRefresh.clear();
    });
  }
  terrainRefresh.set(tileKey(x, z), { x, z });
};
city.on((e) => {
  if (e.type === 'trees') {
    for (const { x, z } of e.tiles) refreshTerrainAt(x, z);
  } else if (e.type === 'added' || e.type === 'removed') {
    const b = e.building;
    for (let z = b.z; z < b.z + b.def.footprint.d; z++) {
      for (let x = b.x; x < b.x + b.def.footprint.w; x++) {
        const flags = view.tileFlagsAt(x, z);
        if (flags === undefined || flags & TileFlag.Water) continue;
        const covered = Boolean(flags & TileFlag.Covered);
        if (covered === Boolean(city.at(x, z))) continue;
        if (
          covered ||
          flags & (TileFlag.Rock | TileFlag.Tree) ||
          hasDepositModel(terrain.tile(x, z).resource)
        )
          refreshTerrainAt(x, z);
      }
    }
  }
});
// Restore a saved game now that every system and renderer is listening.
let missingDefs: string[] = [];
if (loaded) missingDefs = applySave({ city, sim, towns, pois, goals }, loaded).missing;
// Warn visibly on the building itself, not only in a toast.
sim.on((e) => {
  if (e.type === 'warn') buildings.setTint(e.uid, WARNING_TINT);
  else if (e.type === 'resolved' || (e.type === 'declined' && e.to)) buildings.setTint(e.uid, null);
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
let dayNightOn = params.has('daynight') ? params.get('daynight') !== '0' : settings.dayNight;
let fixedTime: number | null = params.has('time') ? num('time', 0.5) : null;

const interfaceLayer = document.createElement('div');
interfaceLayer.className = 'mt-interface';
document.body.appendChild(interfaceLayer);
const bottom = document.createElement('div');
bottom.className = 'mt-bottom';
interfaceLayer.appendChild(bottom);
const menu = mountBuildMenu(city, history, bottom, params.get('tray') !== '0');
mountEncyclopedia(document.body, city.catalog, menu);
mountPolicyMenu(city, document.body, menu.tools);
const say = mountNotifications(sim, city, document.body, (x, z) => view.controller.teleport(x, z), {
  goals,
  pois,
  towns,
});

const top = document.createElement('div');
top.className = 'mt-top';
interfaceLayer.prepend(top);
const left = document.createElement('div');
left.className = 'mt-left';
top.appendChild(left);
const readouts = document.createElement('div');
readouts.className = 'mt-readouts';
top.appendChild(readouts);
mountResourceBar(city, readouts, sim);
left.appendChild(hud);
const leftPanels = document.createElement('div');
leftPanels.className = 'mt-left-panels';
left.appendChild(leftPanels);
if (goals) mountGoalsPanel(goals, leftPanels);
else mountSandboxPanel(setup.sandbox, city, sim, leftPanels);
const renderTowns = mountTownsPanel(towns, sim, leftPanels, (x, z) =>
  view.controller.teleport(x, z),
);
towns.on((e) => {
  if (e.type === 'removed') sim.setDormant(e.town.id, false);
});
const tutorial = setup.tutorial
  ? mountTutorial(
      leftPanels,
      leftPanels.firstElementChild,
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
  new DetailPanel(leftPanels),
);

// Saves: this game's slot (the loaded one, or a new one on first save).
const session = new SaveSession(
  { city, sim, towns, pois, goals },
  loaded?.meta ?? {
    name: cityName,
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
const button = (
  label: string,
  title: string,
  onClick: () => void,
  iconOnly = false,
): HTMLButtonElement => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'mt-newgame-btn';
  b.textContent = label;
  b.title = title;
  if (iconOnly) b.setAttribute('aria-label', title);
  b.addEventListener('click', onClick);
  bar.appendChild(b);
  return b;
};
button(
  '☰',
  t('launch.mainMenu'),
  () => {
    showSessionMenu(
      () => {
        void session.save(true);
        showNewGame(document.body, { seed: seedText });
      },
      async () => {
        if (!(await session.save(true))) return false;
        window.location.assign(window.location.pathname);
        return true;
      },
    );
  },
  true,
);
const saveButton = button(
  '💾',
  `${t('save.title')} (Ctrl+S)`,
  () => showSaveMenu(document.body, session),
  true,
);
const saveLabel = document.createElement('span');
saveLabel.className = 'mt-save-label';
saveLabel.textContent = ` ${t('save.button')}`;
saveButton.appendChild(saveLabel);
const muteLabel = (): string => (audio.muted ? '🔇' : '🔊');
const muteBtn = button(
  muteLabel(),
  t('audio.muteShort'),
  () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = muteLabel();
    muteBtn.setAttribute('aria-pressed', String(audio.muted));
    saveSettings({ ...loadSettings(), muted: audio.muted });
  },
  true,
);
muteBtn.classList.add('mt-mute');
muteBtn.setAttribute('aria-pressed', String(audio.muted));
button(
  '⚙',
  t('settings.title'),
  () =>
    showSettings(
      document.body,
      () => {
        // Reload into this game's slot; if saving is impossible, reload as it is.
        void session.save(true).then((ok) => {
          const url = new URL(
            ok ? urlForSlot(session.slotId) : window.location.href,
            window.location.href,
          );
          for (const key of ['lang', 'r', 'quality', 'terrain', 'daynight', 'traffic'])
            url.searchParams.delete(key);
          window.location.assign(url);
        });
      },
      (v) => {
        audio.volume = v;
      },
    ),
  true,
);
left.insertBefore(bar, leftPanels);
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
    e.preventDefault();
    void session.save();
  }
});
hud.removeAttribute('aria-live');
hud.innerHTML = `<div class="mt-hud-heading"><strong></strong>
  <button type="button" class="mt-help" aria-label="${t('ui.help')} (H)" aria-controls="mt-help-details" title="${t('ui.help')} (H)">
    <span>${t('ui.help')}</span> <kbd>H</kbd>
  </button></div>
  <div class="mt-hud-meta"><span class="mt-game-mode">${t(`mode.${setup.mode}`)}</span>
    <span class="mt-game-seed"></span></div>
  <div class="mt-help-details" id="mt-help-details"></div>`;
hud.querySelector('strong')!.textContent = params.has('city') || loaded ? cityName : 'Myriad Towns';
const seedLabel = hud.querySelector<HTMLElement>('.mt-game-seed')!;
seedLabel.textContent = seedText;
seedLabel.title = `${t('ui.seed')}: ${seedText}`;
const helpButton = hud.querySelector<HTMLButtonElement>('.mt-help')!;
const helpDetails = hud.querySelector<HTMLElement>('.mt-help-details')!;
let hudOpen = params.get('debug') === '1';
const setHelp = (open: boolean): void => {
  hudOpen = open;
  helpDetails.hidden = !open;
  helpButton.setAttribute('aria-expanded', String(open));
  if (open) helpDetails.textContent = t('ui.helpControls');
};
setHelp(hudOpen);
hud.addEventListener('pointerdown', (e) => e.stopPropagation());
helpButton.addEventListener('click', () => setHelp(!hudOpen));
window.addEventListener('keydown', (e) => {
  if (e.code !== 'KeyH' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  if (e.target instanceof Element && e.target.closest('input, select, textarea, [contenteditable]'))
    return;
  setHelp(!hudOpen);
});
const savePanel = (key: 'showMinimap' | 'showHeatmap') => (open: boolean) =>
  saveSettings({ ...loadSettings(), [key]: open });
const map = mountMinimap(bottom, seed, view.controller, city, view, {
  open: params.has('minimap') ? params.get('minimap') !== '0' : settings.showMinimap && !small,
  onToggle: savePanel('showMinimap'),
});
const renderSimBar = mountSimBar(sim, clock, map.toolbar.parentElement!, readouts);
mountPlanBar(plans, history, map.panels, map.toolbar);
mountHeatmapControls(heatmap, map.panels, map.toolbar, {
  open: settings.showHeatmap,
  onToggle: savePanel('showHeatmap'),
});
const lightingMode: LightingMode =
  fixedTime === null
    ? dayNightOn
      ? 'cycle'
      : 'day'
    : fixedTime >= 0.25 && fixedTime < 0.75
      ? 'day'
      : 'night';
const renderLight = mountLighting(left, lightingMode, (mode) => {
  dayNightOn = mode === 'cycle';
  fixedTime = mode === 'day' ? 0.5 : mode === 'night' ? 0 : null;
  renderLight(fixedTime ?? timeOfDay(sim.tick));
});
left.insertBefore(left.lastElementChild!, leftPanels);
renderLight(fixedTime ?? (dayNightOn ? timeOfDay(sim.tick) : 0.5));

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
  const hasTransit = city.countTag('transit') > 0 || city.isPolicyActive('public_transit_subsidy');
  traffic.setPlan(trafficPlan(localPopulation(x, z), paved, small ? 60 : 160, hasTransit));
}

let simHud = 0;
let cropTick = -1;
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
  if (cropTick !== sim.tick) {
    cropTick = sim.tick;
    buildings.updateCrops();
  }
  heatmap.update(s.x, s.z);
  poiView.update(s.x, s.z);
  buildings.update(dt);
  trafficClock += dt;
  if (trafficClock >= 1) {
    trafficClock = 0;
    refreshTrafficPlan(s.x, s.z);
  }
  traffic.update(dt, s, Math.min(60, Math.max(24, s.distance * 0.9 + 16)), clock.speed === 0);
  facilityTraffic.update(dt, s, traffic.enabled, clock.speed === 0);
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
  terrainAt: (x, z) => ({
    resource: terrain.tile(x, z).resource,
    loadedFlags: view.tileFlagsAt(x, z) ?? null,
  }),
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
  renderLight(fixedTime ?? (dayNightOn ? timeOfDay(sim.tick) : 0.5));
  if (!hudOpen) return;
  const s = view.controller.state;
  const tx = Math.floor(s.x);
  const tz = Math.floor(s.z);
  const { cx, cz } = tileToChunk(tx, tz);
  const tile = sampleTile(seed, tx, tz);
  const st = view.chunks.stats();
  helpDetails.textContent = [
    t('ui.helpLocation', {
      tx,
      tz,
      cx,
      cz,
      biome: BIOME_NAMES[tile.biome as Biome],
      level: tile.level,
    }),
    t('ui.helpPerformance', {
      fps,
      tick: sim.lastTickMs.toFixed(2),
      chunks: `${st.visible}/${st.loaded}`,
      draws: view.renderer.info.render.calls,
      scale: view.renderScale.toFixed(2),
    }),
    t('ui.helpControls'),
  ].join('\n');
});

function history_replace(q: URLSearchParams): void {
  const qs = q.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

import { type BuildingDef, type Requirement, isRoadDef } from '@/sim/catalog';
import { type City, rectOf } from '@/sim/city';
import { BatchCommand, DemolishCommand, type History, PlaceCommand } from '@/sim/commands';
import { forTilesInRadius, type Rect } from '@/sim/geometry';
import { type CheckResult, checkPlacement, checkSustain, checkUpgrades } from '@/sim/requirements';
import { pickTile } from '@/render/picking';
import type { PlacementPreview, PreviewTiles } from '@/render/placementPreview';
import type { WorldView } from '@/render/worldView';
import type { BuildMenu, Tool } from './buildMenu';
import { describeCheck } from './describe';
import { buildingName, formatAmounts, t } from './i18n';
import type { InfoPanel, PanelContent, PanelLine } from './infoPanel';
import type { DetailPanel } from './detailPanel';
import type { Problem, Simulation } from '@/sim/simulation';
import type { PlanStore } from '@/sim/plan';
import { EXPLORE_RADIUS, type Poi } from '@/sim/poi';

const CLICK_SLOP_PX = 6;
const MAX_ROAD = 64;

/**
 * Connects pointer input to the city: hover preview with the requirement checklist,
 * click to place, drag to lay roads and rail, demolish, inspect, and undo/redo shortcuts.
 */
export class BuildTool {
  private hover: { x: number; z: number } | null = null;
  private screen = { x: 0, y: 0 };
  private down: { x: number; y: number; tile: { x: number; z: number } | null } | null = null;
  private inspected: number | null = null;
  private readonly ac = new AbortController();

  constructor(
    private readonly view: WorldView,
    private readonly city: City,
    private readonly history: History,
    private readonly preview: PlacementPreview,
    private readonly panel: InfoPanel,
    private readonly menu: BuildMenu,
    private readonly sim?: Simulation,
    private readonly plans?: PlanStore,
    /** Ruins under the cursor, for the hover card. */
    private readonly poiAt?: (x: number, z: number) => { poi: Poi; explored: boolean } | undefined,
    /** Right-hand panel for the chosen or selected building. */
    private readonly detail?: DetailPanel,
  ) {
    const canvas = view.renderer.domElement;
    const signal = this.ac.signal;
    canvas.addEventListener('pointermove', (e) => this.onMove(e), { signal });
    canvas.addEventListener('pointerdown', (e) => this.onDown(e), { signal });
    canvas.addEventListener('pointerup', (e) => this.onUp(e), { signal });
    canvas.addEventListener(
      'pointerleave',
      () => {
        this.hover = null;
        this.refresh();
      },
      { signal },
    );
    window.addEventListener('keydown', (e) => this.onKey(e), { signal });
    menu.onToolChange((tool) => {
      this.inspected = null;
      // An active route tool assigns left-drag to construction.
      view.controller.panWithLeftButton = !(tool.kind === 'build' && this.isLinearTool(tool.defId));
      this.refresh();
    });
    city.on(() => this.refresh());
    history.onChange(() => this.refresh());
    plans?.on(() => this.refresh());
  }

  private get tool(): Tool {
    return this.menu.tool;
  }

  private pick(e: PointerEvent): { x: number; z: number } | null {
    const r = this.view.renderer.domElement.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = -((e.clientY - r.top) / r.height) * 2 + 1;
    return pickTile(this.view.camera, this.view.origin, nx, ny, (x, z) =>
      this.view.groundYAt(x + 0.5, z + 0.5),
    );
  }

  private onMove(e: PointerEvent): void {
    this.screen = { x: e.clientX, y: e.clientY };
    const tile = this.pick(e);
    if (tile?.x === this.hover?.x && tile?.z === this.hover?.z) {
      this.positionOnly();
      return;
    }
    this.hover = tile;
    this.refresh();
  }

  private onDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    this.down = { x: e.clientX, y: e.clientY, tile: this.pick(e) };
  }

  private onUp(e: PointerEvent): void {
    if (e.button !== 0 || !this.down) return;
    const moved = Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > CLICK_SLOP_PX;
    const start = this.down.tile;
    this.down = null;
    const tile = this.pick(e);
    const tool = this.tool;
    if (tool.kind === 'build' && this.isLinearTool(tool.defId)) {
      if (start && tile) this.layRoute(tool.defId, start, tile);
    } else if (!moved && tile) {
      this.click(tile);
    }
    this.refresh();
  }

  private get planning(): boolean {
    return !!this.plans?.mode;
  }

  private click(tile: { x: number; z: number }): void {
    const tool = this.tool;
    if (this.planning && this.plans) {
      if (tool.kind === 'build') {
        const def = this.city.catalog.get(tool.defId);
        const c = this.corner(def, tile);
        this.plans.add(def.id, c.x, c.z);
        return;
      }
      if (tool.kind === 'demolish') {
        const p = this.plans.at(tile.x, tile.z);
        if (p) {
          this.plans.remove(p.id);
          return;
        }
      }
    }
    if (tool.kind === 'build') {
      const def = this.city.catalog.get(tool.defId);
      const c = this.corner(def, tile);
      this.history.run(new PlaceCommand(def.id, c.x, c.z));
    } else if (tool.kind === 'demolish') {
      const b = this.city.at(tile.x, tile.z);
      if (b) this.history.run(new DemolishCommand(b.uid));
    } else {
      const b = this.city.at(tile.x, tile.z);
      this.inspected = b && b.uid !== this.inspected ? b.uid : null;
    }
  }

  /** Roads, bridges and rail are drawn by dragging. */
  private isLinearTool(defId: string): boolean {
    return defId === 'rail_track' || isRoadDef(this.city.catalog.get(defId));
  }

  private layRoute(defId: string, a: { x: number; z: number }, b: { x: number; z: number }): void {
    if (this.planning && this.plans) {
      for (const p of roadPath(a, b)) this.plans.add(defId, p.x, p.z);
      return;
    }
    const parts = roadPath(a, b).map((p) => new PlaceCommand(defId, p.x, p.z));
    this.history.run(new BatchCommand(defId, parts));
  }

  private onKey(e: KeyboardEvent): void {
    if (e.target instanceof HTMLInputElement) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.code === 'KeyZ') {
      e.preventDefault();
      if (e.shiftKey) this.history.redo();
      else this.history.undo();
    } else if (mod && e.code === 'KeyY') {
      e.preventDefault();
      this.history.redo();
    } else if (e.code === 'Escape') {
      this.inspected = null;
      this.menu.setTool({ kind: 'none' });
    } else if (e.code === 'KeyP' && !mod && this.plans) {
      this.plans.setMode(!this.plans.mode);
    } else if (e.code === 'KeyX' && !mod) {
      this.menu.setTool(this.tool.kind === 'demolish' ? { kind: 'none' } : { kind: 'demolish' });
    }
  }

  /** Footprint corner so the cursor sits on the building's centre tile. */
  private corner(def: BuildingDef, tile: { x: number; z: number }): { x: number; z: number } {
    return {
      x: tile.x - Math.floor((def.footprint.w - 1) / 2),
      z: tile.z - Math.floor((def.footprint.d - 1) / 2),
    };
  }

  private positionOnly(): void {
    if (this.tool.kind !== 'none' || this.inspected === null) this.refresh();
  }

  /** Recompute preview overlays and the checklist panel. */
  refresh(): void {
    const tool = this.tool;
    const empty: PreviewTiles = { footprint: [], affects: [], checks: [], markers: [] };

    if (tool.kind === 'none') {
      this.preview.setGhost(null);
      const uid = this.inspected;
      const b = uid !== null ? this.city.get(uid) : undefined;
      if (!b) {
        this.inspected = null;
        const hovered = this.hover ? this.city.at(this.hover.x, this.hover.z) : undefined;
        this.preview.setTiles(
          hovered
            ? { ...empty, footprint: rectTiles(rectOf(hovered.def, hovered.x, hovered.z), true) }
            : empty,
        );
        const poi = !hovered && this.hover ? this.poiAt?.(this.hover.x, this.hover.z) : undefined;
        if (poi) {
          this.panel.show(
            {
              title: t(`poi.${poi.poi.kind}`),
              sections: [
                {
                  lines: [
                    poi.explored
                      ? { ok: true, text: t('poi.explored') }
                      : { text: t('poi.hint', { r: EXPLORE_RADIUS }) },
                    { text: t('ui.reward', { what: formatAmounts(poi.poi.reward) }) },
                  ],
                },
              ],
            },
            this.screen,
          );
        } else {
          this.panel.hide();
        }
        this.detail?.hide();
        return;
      }
      const rect = rectOf(b.def, b.x, b.z);
      const sustain = checkSustain(this.city, b.uid);
      const upgrades = checkUpgrades(this.city, b.uid);
      const all = [...sustain, ...upgrades.flatMap((u) => u.checks)];
      this.preview.setTiles({
        footprint: rectTiles(
          rect,
          sustain.every((c) => c.ok),
        ),
        affects: emitTiles(b.def, rect),
        checks: checkTiles(all, rect),
        markers: markersFor(this.city, all),
      });
      const demolishAction = {
        label: t('ui.demolish').replace(/ \(.*\)/, ''),
        run: () => {
          this.history.run(new DemolishCommand(b.uid));
          this.inspected = null;
        },
      };
      if (this.detail) {
        this.panel.hide();
        this.detail.show({
          def: b.def,
          status: this.statusLines(b.uid),
          conditions: sustain.map(line),
          next: upgrades
            .map((u) => ({
              def: this.city.catalog.get(u.to),
              lines: u.checks.map(line),
            }))
            .concat(this.mergeOptions(b.def)),
          action: demolishAction,
        });
        return;
      }
      this.panel.show(
        {
          title: buildingName(b.def.id),
          sections: [
            { title: t('ui.status'), lines: this.statusLines(b.uid) },
            { title: t('ui.produces'), lines: info(b.def) },
            { lines: sustain.map(line) },
            ...upgrades.map((u) => ({
              title: t('ui.upgradeTo', { name: buildingName(u.to) }),
              lines: u.checks.map(line),
            })),
          ],
          action: demolishAction,
        },
        'pinned',
      );
      return;
    }

    if (tool.kind === 'build') this.showToolDetail(tool.defId);
    else this.detail?.hide();

    if (!this.hover) {
      this.preview.clear();
      this.panel.hide();
      return;
    }

    if (tool.kind === 'demolish') {
      this.preview.setGhost(null);
      const b = this.city.at(this.hover.x, this.hover.z);
      if (!b) {
        this.preview.setTiles(empty);
        this.panel.hide();
        return;
      }
      this.preview.setTiles({ ...empty, footprint: rectTiles(rectOf(b.def, b.x, b.z), false) });
      this.panel.show(
        {
          title: `${t('ui.demolish').replace(/ \(.*\)/, '')}: ${buildingName(b.def.id)}`,
          sections: [
            {
              lines: [
                { text: t('ui.refund', { cost: formatAmounts(this.city.refundOf(b.def)) || '—' }) },
              ],
            },
          ],
        },
        this.screen,
      );
      return;
    }

    const def = this.city.catalog.get(tool.defId);
    if (this.isLinearTool(def.id) && this.down?.tile) {
      // Preview the whole path during a drag.
      const path = roadPath(this.down.tile, this.hover);
      const fp = path.map((p) => ({ ...p, ok: checkPlacement(this.city, def, p.x, p.z).ok }));
      const okCount = fp.filter((p) => p.ok).length;
      this.preview.setGhost(null);
      this.preview.setTiles({ ...empty, footprint: fp });
      this.panel.show(
        {
          title: `${buildingName(def.id)} × ${okCount}`,
          sections: [
            { lines: [{ text: `${t('ui.cost')}: ${formatAmounts(scale(def.cost, okCount))}` }] },
          ],
        },
        this.screen,
      );
      return;
    }

    const c = this.corner(def, this.hover);
    const check = checkPlacement(this.city, def, c.x, c.z);
    const rect = rectOf(def, c.x, c.z);
    this.preview.setGhost(def, c.x, c.z, check.ok);
    this.preview.setTiles({
      footprint: rectTiles(rect, check.ok),
      affects: emitTiles(def, rect),
      checks: checkTiles(check.requires, rect),
      markers: markersFor(this.city, check.requires),
    });
    const content: PanelContent = {
      title: buildingName(def.id),
      sections: [
        {
          lines: [
            { ok: check.cost.ok, text: `${t('ui.cost')}: ${formatAmounts(def.cost) || '—'}` },
            ...check.site.filter((s) => !s.ok || s.key !== 'req.footprint').map(line),
            ...check.site.filter((s) => s.ok && s.key === 'req.footprint').map(line),
            ...check.requires.map(line),
            ...(check.treesToCut ? [{ text: t('ui.treesCleared') }] : []),
          ],
        },
      ],
      verdict: this.planning
        ? {
            ok: check.site.every((x) => x.ok || x.key === 'req.locked'),
            text: t('ui.addToPlan'),
          }
        : { ok: check.ok, text: check.ok ? t('ui.canPlace') : t('ui.cannotPlace') },
    };
    this.panel.show(content, this.screen);
  }

  /** Right-hand panel for the building chosen in the menu: what it is, needs and becomes. */
  private showToolDetail(defId: string): void {
    if (!this.detail) return;
    const def = this.city.catalog.get(defId);
    const live = this.hover && !(def.id === 'road' && this.down?.tile);
    const locked = this.city.progress.lockReason(def);
    const conditions: PanelLine[] = live
      ? (() => {
          const c = this.corner(def, this.hover as { x: number; z: number });
          const check = checkPlacement(this.city, def, c.x, c.z);
          return [...check.site.filter((item) => !item.ok), ...check.requires].map(line);
        })()
      : [
          ...(locked ? [line({ ok: false, key: locked.key, params: locked.params })] : []),
          ...[...(def.requires ?? []), ...(def.placementRequires ?? [])].map((r) => ({
            text: describeCheck(placeholder(r)),
          })),
        ];
    this.detail.show({
      def,
      cost: def.cost,
      conditions,
      next: (def.upgrades ?? [])
        .map((u) => ({
          def: this.city.catalog.get(u.to),
          lines: u.when.map((r): PanelLine => ({ text: describeCheck(placeholder(r)) })),
        }))
        .concat(this.mergeOptions(def)),
    });
  }

  private mergeOptions(def: BuildingDef): { def: BuildingDef; lines: PanelLine[] }[] {
    return (def.mergeInto ?? []).map((rule) => {
      const target = this.city.catalog.get(rule.to);
      const { w, d } = target.footprint;
      return {
        def: target,
        lines: [
          { text: t('ui.mergeHomes', { n: w * d, w, d }) },
          ...rule.when.map((req) => ({ text: describeCheck(placeholder(req)) })),
        ],
      };
    });
  }

  /** The "Why?" lines: is it working, what is missing, and what happens next. */
  private statusLines(uid: number): PanelLine[] {
    const sim = this.sim;
    const b = this.city.get(uid);
    if (!sim || !b) return [];
    const out: PanelLine[] = [];
    const active = this.city.isActive(uid);
    const s = sim.stateOf(uid);
    if (!active) out.push({ ok: false, text: t('status.abandoned') });
    if (b.def.crop) out.push({ text: t(`crop.stage${sim.cropStageOf(uid)}`) });
    if (b.def.voyage) {
      const phase = sim.voyagePhaseOf(uid);
      if (!sim.voyageRouteOf(uid)?.length) out.push({ ok: false, text: t('voyage.noRoute') });
      else
        out.push({
          text: t(
            phase === 0 ? 'voyage.docked' : phase < 0.5 ? 'voyage.outbound' : 'voyage.returning',
            {
              n: Math.floor(phase * 100),
            },
          ),
        });
    }
    for (const p of s?.shortages ?? []) out.push({ ok: false, text: problemText(p) });
    const left = sim.declineIn(uid);
    if (left !== undefined) {
      const secs = Math.ceil(left / 4);
      out.push({
        ok: false,
        text: b.def.decline?.to
          ? t('status.declineTo', { to: buildingName(b.def.decline.to), s: secs })
          : t('status.abandonIn', { s: secs }),
      });
    }
    if (active && out.length === 0) out.push({ ok: true, text: t('status.working') });
    return out;
  }

  dispose(): void {
    this.ac.abort();
  }
}

function problemText(p: Problem): string {
  switch (p.kind) {
    case 'labor':
      return t('status.noLabor', { what: t(`resource.${p.tier}`) });
    case 'input':
      return t('status.noInput', { what: t(`resource.${p.resource}`) });
    case 'hungry':
      return t('status.hungry', { what: t(`resource.${p.resource}`) });
    case 'requirement':
      return describeCheck(p.check);
  }
}

function line(c: CheckResult): PanelLine {
  return { ok: c.ok, text: describeCheck(c) };
}

/** Static facts about a building: housing, production, upkeep, what it spreads. */
function info(def: BuildingDef): PanelLine[] {
  const out: PanelLine[] = [];
  if (def.housing) out.push({ text: t('ui.housing', { n: def.housing }) });
  if (def.produces) out.push({ text: `+ ${formatAmounts(def.produces)} ${t('ui.perSecond')}` });
  if (def.upkeep) out.push({ text: `− ${formatAmounts(def.upkeep)} ${t('ui.perSecond')}` });
  for (const e of def.emits ?? []) {
    out.push({
      text: `${t('ui.emits')}: ${t(`field.${e.field}`)} ${e.amount > 0 ? '+' : ''}${e.amount} (r=${e.radius})`,
    });
  }
  return out;
}

/** A requirement shown as text without evaluating it (for "upgrades when" hints). */
function placeholder(r: Requirement): CheckResult {
  switch (r.type) {
    case 'near':
      return {
        ok: false,
        key: 'req.near',
        params: { building: r.building, r: r.radius, need: r.min ?? 1, have: '…' },
      };
    case 'notNear':
      return {
        ok: false,
        key: 'req.notNear',
        params: { building: r.building, r: r.radius, have: '…' },
      };
    case 'field':
      return r.min !== undefined
        ? { ok: false, key: 'req.fieldMin', params: { field: r.field, min: r.min, have: '…' } }
        : {
            ok: false,
            key: 'req.fieldMax',
            params: { field: r.field, max: r.max ?? 0, have: '…' },
          };
    case 'terrain':
      return {
        ok: false,
        key: 'req.terrain',
        params: { terrain: r.terrain, r: r.radius, need: r.min ?? 1, have: '…' },
      };
    case 'road':
      return {
        ok: false,
        key: r.paved ? 'req.pavedRoad' : 'req.road',
        params: { d: r.maxDistance },
      };
  }
}

function rectTiles(rect: Rect, ok: boolean): { x: number; z: number; ok: boolean }[] {
  const out: { x: number; z: number; ok: boolean }[] = [];
  for (let z = rect.z; z < rect.z + rect.d; z++)
    for (let x = rect.x; x < rect.x + rect.w; x++) out.push({ x, z, ok });
  return out;
}

function ringTiles(rect: Rect, r: number): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  forTilesInRadius(rect, r, (x, z, d) => {
    if (d > 0) out.push({ x, z });
  });
  return out;
}

function emitTiles(def: BuildingDef, rect: Rect): { x: number; z: number }[] {
  const r = Math.max(0, ...(def.emits ?? []).map((e) => e.radius));
  return r > 0 ? ringTiles(rect, r) : [];
}

function checkTiles(checks: readonly CheckResult[], rect: Rect): { x: number; z: number }[] {
  const r = Math.max(0, ...checks.map((c) => c.radius ?? 0));
  return r > 0 ? ringTiles(rect, r) : [];
}

function markersFor(city: City, checks: readonly CheckResult[]): PreviewTiles['markers'] {
  const out: PreviewTiles['markers'] = [];
  for (const c of checks) {
    for (const uid of c.matches ?? []) {
      const b = city.get(uid);
      if (!b) continue;
      out.push({ x: b.x, z: b.z, good: c.key !== 'req.notNear' });
    }
  }
  return out;
}

/** L-shaped path: along x first, then z. */
export function roadPath(
  a: { x: number; z: number },
  b: { x: number; z: number },
): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  const sx = Math.sign(b.x - a.x);
  const sz = Math.sign(b.z - a.z);
  let x = a.x;
  let z = a.z;
  out.push({ x, z });
  while (x !== b.x && out.length < MAX_ROAD) {
    x += sx;
    out.push({ x, z });
  }
  while (z !== b.z && out.length < MAX_ROAD) {
    z += sz;
    out.push({ x, z });
  }
  return out;
}

function scale(a: Readonly<Record<string, number>>, n: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(a)) out[k] = v * n;
  return out;
}

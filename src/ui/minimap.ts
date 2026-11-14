import './minimap.css';
import { Biome, TileFlag } from '@/world/biomes';
import { sampleTile } from '@/world/terrain';
import type { CameraController } from '@/render/cameraController';
import type { WorldView } from '@/render/worldView';
import type { City } from '@/sim/city';
import { isRoadDef } from '@/sim/catalog';
import { t } from './i18n';

export interface Point2D {
  x: number;
  z: number;
}

export interface Pixel2D {
  px: number;
  py: number;
}

export const MINIMAP_SIZE = 160;
export const TILES_PER_PIXEL = 4;
export const MOVE_THRESHOLD_TILES = 16;

/**
 * Biome colors for the 2D minimap canvas.
 */
export const BIOME_COLORS: Record<number, [number, number, number]> = {
  [Biome.Ocean]: [43, 101, 146], // Deep ocean blue
  [Biome.Beach]: [216, 194, 138], // Sandy yellow
  [Biome.Temperate]: [104, 163, 87], // Lush grass green
  [Biome.Forest]: [62, 115, 59], // Dark forest green
  [Biome.Steppe]: [158, 163, 83], // Dry savanna olive
  [Biome.Cold]: [168, 196, 190], // Pale tundra / ice
  [Biome.Mountain]: [122, 121, 117], // Mountain slate
  [Biome.Ruins]: [138, 111, 101], // Ruins brick/stone
};

export const RIVER_COLOR: [number, number, number] = [82, 153, 211]; // Lighter river blue
export const SNOW_COLOR: [number, number, number] = [225, 235, 240]; // High mountain peak snow

/**
 * Converts minimap pixel coordinates (px, py) to world tile coordinates (wx, wz).
 * Fixed North-up orientation: +x is East, -z is North.
 */
export function pixelToWorld(
  px: number,
  py: number,
  cameraX: number,
  cameraZ: number,
  size = MINIMAP_SIZE,
  tilesPerPixel = TILES_PER_PIXEL,
): Point2D {
  const cx = size / 2;
  const cy = size / 2;
  return {
    x: cameraX + (px - cx) * tilesPerPixel,
    z: cameraZ + (py - cy) * tilesPerPixel,
  };
}

/**
 * Converts world tile coordinates (wx, wz) to minimap pixel coordinates (px, py).
 * Inverse of pixelToWorld.
 */
export function worldToPixel(
  wx: number,
  wz: number,
  cameraX: number,
  cameraZ: number,
  size = MINIMAP_SIZE,
  tilesPerPixel = TILES_PER_PIXEL,
): Pixel2D {
  const cx = size / 2;
  const cy = size / 2;
  return {
    px: cx + (wx - cameraX) / tilesPerPixel,
    py: cy + (wz - cameraZ) / tilesPerPixel,
  };
}

export interface MinimapHandle {
  readonly el: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  toggle(): void;
  show(): void;
  hide(): void;
  isOpen(): boolean;
  update(): void;
  dispose(): void;
  /** Performance stats for verification. */
  readonly stats: {
    lastSliceMs: number;
    maxSliceMs: number;
    fullRefreshCount: number;
  };
}

/**
 * Mounts the minimap in the bottom-right corner.
 */
export function mountMinimap(
  parent: HTMLElement,
  seed: number,
  camera: CameraController,
  city: City,
  view?: WorldView,
): MinimapHandle {
  const size = MINIMAP_SIZE;
  const radius = size / 2;
  const cx = radius;
  const cy = radius;

  const el = document.createElement('div');
  el.className = 'mt-minimap';
  el.title = t('minimap.toggle');
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', t('minimap.label'));

  // Default hidden on narrow screens (<= 600px)
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 600;
  let isVisible = !isSmallScreen;
  if (!isVisible) el.classList.add('hidden');

  const root = typeof el.attachShadow === 'function' ? el.attachShadow({ mode: 'closed' }) : el;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.borderRadius = '50%';
  root.appendChild(canvas);
  parent.appendChild(el);

  // Phones have no M key: a small button shows the map while it is hidden.
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mt-minimap-btn';
  btn.textContent = '🗺';
  btn.title = t('minimap.toggle');
  btn.setAttribute('aria-label', t('minimap.toggle'));
  btn.hidden = isVisible;
  btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    show();
  });
  parent.appendChild(btn);

  const ctx = canvas.getContext('2d');

  // Reuse one single ImageData across frames (zero per-frame allocations)
  const imageData = ctx ? ctx.createImageData(size, size) : null;
  const pixels = imageData ? imageData.data : null;

  // Offscreen canvas to hold the sampled terrain layer
  const offscreen = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (offscreen) {
    offscreen.width = size;
    offscreen.height = size;
  }
  const offCtx = offscreen?.getContext('2d') ?? null;

  let currentSliceRow = size; // size means sampling complete
  let sampleCenterX = camera.state.x;
  let sampleCenterZ = camera.state.z;
  let lastYaw = camera.state.yaw;
  let needsBuildingRedraw = true;
  // Centre of the terrain image on the offscreen canvas, and where the camera was at the last draw.
  let committedX = sampleCenterX;
  let committedZ = sampleCenterZ;
  let drawnX = camera.state.x;
  let drawnZ = camera.state.z;

  const stats = {
    lastSliceMs: 0,
    maxSliceMs: 0,
    fullRefreshCount: 0,
  };

  const samplePixel = (px: number, py: number): void => {
    if (!pixels) return;
    const index = (py * size + px) * 4;
    const dx = px - cx;
    const dy = py - cy;
    if (dx * dx + dy * dy > radius * radius) {
      pixels[index + 3] = 0;
      return;
    }

    const wx = Math.floor(sampleCenterX + dx * TILES_PER_PIXEL);
    const wz = Math.floor(sampleCenterZ + dy * TILES_PER_PIXEL);
    const sample = sampleTile(seed, wx, wz);

    let color: [number, number, number];
    if (sample.flags & TileFlag.Water) {
      color = sample.flags & TileFlag.River ? RIVER_COLOR : BIOME_COLORS[Biome.Ocean]!;
    } else if (sample.level >= 14) {
      color = SNOW_COLOR;
    } else {
      color = BIOME_COLORS[sample.biome] ?? BIOME_COLORS[Biome.Temperate]!;
    }

    pixels[index] = color[0];
    pixels[index + 1] = color[1];
    pixels[index + 2] = color[2];
    pixels[index + 3] = 255;
  };

  const startTerrainSampling = (newCenterX: number, newCenterZ: number): void => {
    sampleCenterX = newCenterX;
    sampleCenterZ = newCenterZ;
    currentSliceRow = 0;
  };

  const redrawCanvas = (): void => {
    if (!ctx || !offscreen || !offCtx) return;

    ctx.clearRect(0, 0, size, size);

    // 1. Draw sampled terrain layer, shifted by how far the camera is from where it was sampled,
    // so terrain and buildings stay aligned between refreshes.
    ctx.drawImage(
      offscreen,
      (committedX - camera.state.x) / TILES_PER_PIXEL,
      (committedZ - camera.state.z) / TILES_PER_PIXEL,
    );

    // 2. Draw placed buildings from city.all()
    // Roads: light brown (#c4a47c)
    // Other buildings: 2x2 px white dot with dark outline
    const camX = camera.state.x;
    const camZ = camera.state.z;

    const roads: { px: number; py: number }[] = [];
    const structures: { px: number; py: number }[] = [];

    for (const b of city.all()) {
      const p = worldToPixel(
        b.x + b.def.footprint.w / 2,
        b.z + b.def.footprint.d / 2,
        camX,
        camZ,
        size,
        TILES_PER_PIXEL,
      );
      const d2 = (p.px - cx) * (p.px - cx) + (p.py - cy) * (p.py - cy);
      if (d2 <= (radius - 2) * (radius - 2)) {
        if (isRoadDef(b.def)) roads.push(p);
        else structures.push(p);
      }
    }

    // Draw roads
    if (roads.length > 0) {
      ctx.fillStyle = '#c4a47c';
      for (const r of roads) {
        ctx.fillRect(Math.floor(r.px), Math.floor(r.py), 1, 1);
      }
    }

    // Draw other buildings: 2x2 white dot with dark border
    if (structures.length > 0) {
      for (const s of structures) {
        const sx = Math.round(s.px);
        const sy = Math.round(s.py);
        ctx.fillStyle = '#111111';
        ctx.fillRect(sx - 1, sy - 1, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // 3. Draw camera marker (view direction yaw)
    const yaw = camera.state.yaw;
    const vx = Math.sin(yaw);
    const vy = -Math.cos(yaw);
    const angle = Math.atan2(vy, vx);

    ctx.save();
    ctx.translate(cx, cy);

    // View direction frustum / chevron
    const len = 13;
    const fov = 0.45; // ~26 deg half-angle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle - fov) * len, Math.sin(angle - fov) * len);
    ctx.lineTo(Math.cos(angle + fov) * len, Math.sin(angle + fov) * len);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Camera center point
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // Compass "N" North indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 11);
  };

  const update = (): void => {
    if (!isVisible) return;

    const camX = camera.state.x;
    const camZ = camera.state.z;
    const camYaw = camera.state.yaw;

    // Check if camera moved beyond threshold (>= 16 tiles) to start new terrain sampling
    const movedDist = Math.hypot(camX - sampleCenterX, camZ - sampleCenterZ);
    if (movedDist >= MOVE_THRESHOLD_TILES && currentSliceRow >= size) {
      startTerrainSampling(camX, camZ);
    }

    // Slice sampling (<= 2 ms per frame)
    if (currentSliceRow < size && pixels && offCtx) {
      const sliceStart = performance.now();
      while (currentSliceRow < size && performance.now() - sliceStart < 1.5) {
        for (let px = 0; px < size; px++) {
          samplePixel(px, currentSliceRow);
        }
        currentSliceRow++;
      }
      const elapsed = performance.now() - sliceStart;
      stats.lastSliceMs = elapsed;
      if (elapsed > stats.maxSliceMs) stats.maxSliceMs = elapsed;

      // When all rows are sampled, commit to offscreen canvas
      if (currentSliceRow >= size && imageData) {
        offCtx.putImageData(imageData, 0, 0);
        committedX = sampleCenterX;
        committedZ = sampleCenterZ;
        stats.fullRefreshCount++;
        needsBuildingRedraw = true;
      }
    }

    // Redraw canvas if camera moved, rotated, or buildings were updated
    const yawChanged = Math.abs(camYaw - lastYaw) > 0.01;
    // Compare with the last draw, not the sample centre, so a still camera costs nothing.
    const drawMoved = Math.hypot(camX - drawnX, camZ - drawnZ) > 0.5;
    if (needsBuildingRedraw || yawChanged || drawMoved) {
      redrawCanvas();
      lastYaw = camYaw;
      drawnX = camX;
      drawnZ = camZ;
      needsBuildingRedraw = false;
    }
  };

  // Initial sampling start
  startTerrainSampling(camera.state.x, camera.state.z);
  // Perform first slice immediately
  update();

  // City events trigger building redraws
  const unsubscribeCity = city.on((e) => {
    if (e.type === 'added' || e.type === 'removed') {
      needsBuildingRedraw = true;
    }
  });

  // Click on minimap teleports camera to clicked world position
  const onPointerDown = (e: PointerEvent): void => {
    e.stopPropagation();
  };

  const onClick = (e: MouseEvent): void => {
    e.stopPropagation();
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * size;
    const py = ((e.clientY - rect.top) / rect.height) * size;

    const dx = px - cx;
    const dy = py - cy;
    if (dx * dx + dy * dy <= radius * radius) {
      const target = pixelToWorld(px, py, camera.state.x, camera.state.z, size, TILES_PER_PIXEL);
      camera.teleport(target.x, target.z);
    }
  };

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('click', onClick);

  // Toggle visibility with M key (ignored when typing in an input or textarea)
  const onKeyDown = (e: KeyboardEvent): void => {
    const tgt = e.target as HTMLElement | null;
    if (
      tgt instanceof HTMLInputElement ||
      tgt instanceof HTMLTextAreaElement ||
      tgt instanceof HTMLSelectElement ||
      tgt?.isContentEditable
    )
      return;
    if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggle();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  const toggle = (): void => {
    if (isVisible) hide();
    else show();
  };

  const show = (): void => {
    isVisible = true;
    el.classList.remove('hidden');
    btn.hidden = true;
    needsBuildingRedraw = true;
    update();
  };

  const hide = (): void => {
    isVisible = false;
    el.classList.add('hidden');
    btn.hidden = false;
  };

  // Register with view.onFrame if view is provided
  if (view) {
    view.onFrame(() => update());
  }

  const dispose = (): void => {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKeyDown);
    unsubscribeCity();
    el.remove();
    btn.remove();
  };

  return {
    el,
    canvas,
    toggle,
    show,
    hide,
    isOpen: () => isVisible,
    update,
    dispose,
    stats,
  };
}

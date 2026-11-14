import * as THREE from 'three';
import { CHUNK_SIZE, chunkKey, localIndex, tileToChunk, tileToLocal } from '@/core/coords';
import { TileFlag } from '@/world/biomes';
import { ChunkManager } from '@/world/chunkManager';
import type { ChunkGenerator } from '@/world/genPool';
import type { ChunkData } from '@/world/chunk';
import { sampleTile } from '@/world/terrain';
import { buildTerrainMesh, LEVEL_HEIGHT, WATER_Y } from '@/world/terrainMesh';
import { CameraController, type CameraState } from './cameraController';
import { FloatingOrigin } from './floatingOrigin';
import { AdaptiveResolution, qualitySettings, type QualitySettings } from './quality';
import { TerrainRenderer } from './terrainRenderer';
import { lightingAt, type Lighting } from './dayNight';

const SKY = new THREE.Color('#9cc9dc');

export interface WorldViewOptions {
  seed: number;
  viewRadius: number;
  generator: ChunkGenerator;
  start?: Partial<CameraState>;
  /**
   * Applies player edits (e.g. cut trees) to freshly generated chunk data.
   * Returns true if anything changed, so the mesh is rebuilt on the main thread.
   */
  patchChunk?: (chunk: ChunkData) => boolean;
  /** Defaults to the 'medium' preset for this device. */
  quality?: QualitySettings;
}

/** The 3D world: renderer, lights, camera, and terrain chunks that stream around the camera. */
export class WorldView {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly origin = new FloatingOrigin();
  readonly controller: CameraController;
  readonly chunks: ChunkManager;
  private readonly terrain: TerrainRenderer;
  private readonly sun: THREE.DirectionalLight;
  private readonly hemi: THREE.HemisphereLight;
  private readonly sky = SKY.clone();
  /** Direction towards the sun; the classic fixed sun until a time of day is set. */
  private readonly sunDir = new THREE.Vector3(60, 110, 35).normalize();
  private lighting: Lighting | undefined;
  private timeOfDayValue: number | null = null;
  private readonly fog: THREE.Fog;
  private readonly clock = new THREE.Clock();
  private readonly resizeObserver: ResizeObserver;
  private frameListeners: ((dt: number) => void)[] = [];
  private readonly seed: number;
  private readonly patch: ((chunk: ChunkData) => boolean) | undefined;
  readonly quality: QualitySettings;
  private readonly adaptive: AdaptiveResolution | undefined;

  constructor(
    private readonly container: HTMLElement,
    opts: WorldViewOptions,
  ) {
    this.seed = opts.seed;
    this.patch = opts.patchChunk;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.quality = opts.quality ?? qualitySettings('medium', window.devicePixelRatio);
    const q = this.quality;
    // Fill rate dominates on integrated GPUs: cap the pixel ratio and adapt it at runtime.
    this.adaptive = q.adaptive
      ? new AdaptiveResolution(q.maxPixelRatio, { min: q.minPixelRatio, max: q.maxPixelRatio })
      : undefined;
    this.renderer.setPixelRatio(q.maxPixelRatio);
    this.renderer.shadowMap.enabled = q.shadows;
    // PCF (hardware 2x2) instead of PCFSoft: a fraction of the cost, barely visible at this scale.
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene.background = this.sky;
    this.fog = new THREE.Fog(this.sky, 100, 300);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.5, 1200);

    this.hemi = new THREE.HemisphereLight('#dceeff', '#5a6b48', 1.1);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff1d6', 2.0);
    this.sun.castShadow = q.shadows;
    this.sun.shadow.mapSize.set(q.shadowMapSize, q.shadowMapSize);
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.05;
    this.scene.add(this.sun, this.sun.target);

    this.terrain = new TerrainRenderer(this.origin);
    this.scene.add(this.terrain.group);

    const sx = opts.start?.x ?? 0;
    const sz = opts.start?.z ?? 0;
    this.origin.follow(sx, sz);
    this.controller = new CameraController(
      this.camera,
      this.renderer.domElement,
      this.origin,
      opts.start,
    );

    this.chunks = new ChunkManager(
      opts.seed,
      opts.generator,
      {
        onChunkLoaded: (chunk, mesh) =>
          this.terrain.add(
            chunk,
            opts.patchChunk?.(chunk) ? buildTerrainMesh(opts.seed, chunk) : mesh,
          ),
        onChunkUnloaded: (key) => this.terrain.remove(key),
        onChunkVisibility: (key, v) => this.terrain.setVisible(key, v),
      },
      { viewRadius: opts.viewRadius },
    );

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  /**
   * Lights the scene for a time of day (0 midnight, 0.5 noon), or null for the classic fixed
   * daylight. Cheap: only colours and one light direction change.
   */
  setTimeOfDay(time: number | null): void {
    this.timeOfDayValue = time;
    if (time === null) {
      this.sky.copy(SKY);
      this.sun.color.set('#fff1d6');
      this.sun.intensity = 2.0;
      this.hemi.color.set('#dceeff');
      this.hemi.groundColor.set('#5a6b48');
      this.hemi.intensity = 1.1;
      this.sunDir.set(60, 110, 35).normalize();
      return;
    }
    const l = (this.lighting = lightingAt(time, this.lighting));
    this.sky.copy(l.sky);
    this.sun.color.copy(l.sunColor);
    this.sun.intensity = l.sunIntensity;
    this.hemi.color.copy(l.hemiSky);
    this.hemi.groundColor.copy(l.hemiGround);
    this.hemi.intensity = l.hemiIntensity;
    this.sunDir.copy(l.sunDir);
  }

  get timeOfDay(): number | null {
    return this.timeOfDayValue;
  }

  /** 0 by day … 1 at midnight (0 when day/night is off). */
  get nightness(): number {
    return this.timeOfDayValue === null ? 0 : (this.lighting?.night ?? 0);
  }

  onFrame(fn: (dt: number) => void): void {
    this.frameListeners.push(fn);
  }

  /** Ground surface y at a world tile, if its chunk is loaded. */
  groundYAt(wx: number, wz: number): number | undefined {
    const tx = Math.floor(wx);
    const tz = Math.floor(wz);
    const { cx, cz } = tileToChunk(tx, tz);
    const chunk = this.chunks.get(chunkKey(cx, cz));
    if (!chunk) return undefined;
    const { lx, lz } = tileToLocal(tx, tz);
    const i = localIndex(lx, lz);
    if ((chunk.flags[i] as number) & TileFlag.Water) return WATER_Y;
    return (chunk.level[i] as number) * LEVEL_HEIGHT;
  }

  /** Tile flags (water, trees…) at a world position, if its chunk is loaded. */
  tileFlagsAt(wx: number, wz: number): number | undefined {
    const tx = Math.floor(wx);
    const tz = Math.floor(wz);
    const { cx, cz } = tileToChunk(tx, tz);
    const chunk = this.chunks.get(chunkKey(cx, cz));
    if (!chunk) return undefined;
    const { lx, lz } = tileToLocal(tx, tz);
    return chunk.flags[localIndex(lx, lz)] as number;
  }

  /** Re-apply edits and rebuild the meshes of loaded chunks containing these tiles. */
  refreshTiles(tiles: readonly { x: number; z: number }[]): void {
    const keys = new Set<number>();
    for (const t of tiles) {
      const { cx, cz } = tileToChunk(t.x, t.z);
      keys.add(chunkKey(cx, cz));
    }
    for (const key of keys) {
      const chunk = this.chunks.get(key as ReturnType<typeof chunkKey>);
      if (!chunk) continue;
      // Reset the touched tiles to generated state, then re-apply edits.
      for (const t of tiles) {
        const { cx, cz } = tileToChunk(t.x, t.z);
        if (cx !== chunk.cx || cz !== chunk.cz) continue;
        const { lx, lz } = tileToLocal(t.x, t.z);
        chunk.flags[localIndex(lx, lz)] = sampleTile(this.seed, t.x, t.z).flags;
      }
      this.patch?.(chunk);
      const visible = this.terrain.isVisible(key as ReturnType<typeof chunkKey>);
      this.terrain.add(chunk, buildTerrainMesh(this.seed, chunk));
      this.terrain.setVisible(key as ReturnType<typeof chunkKey>, visible);
    }
  }

  /** Ground y used to stand buildings on (top of the tile, water surface for water). */
  surfaceY(wx: number, wz: number): number {
    return this.groundYAt(wx, wz) ?? 0;
  }

  get terrainMeshCount(): number {
    return this.terrain.count;
  }

  /** Current pixel ratio actually rendered (after adaptive resolution). */
  get renderScale(): number {
    return this.renderer.getPixelRatio();
  }

  private frame(): void {
    const raw = this.clock.getDelta();
    if (this.adaptive?.push(raw * 1000)) {
      this.renderer.setPixelRatio(this.adaptive.scale);
      this.resize();
    }
    const dt = Math.min(0.1, raw);
    const s = this.controller.state;

    const ground = this.groundYAt(s.x, s.z);
    if (ground !== undefined) {
      this.controller.groundY += (ground - this.controller.groundY) * (1 - Math.exp(-dt * 6));
    }
    this.controller.update(dt);
    if (this.origin.follow(s.x, s.z)) this.controller.apply();
    this.chunks.update(tileToChunk(Math.floor(s.x), Math.floor(s.z)));

    // Fog hides the streaming edge; it tracks zoom so close-ups stay crisp.
    const edge = this.chunks.viewRadius * CHUNK_SIZE;
    this.fog.near = s.distance + edge * 0.35;
    this.fog.far = s.distance + edge * 0.85;

    // Sun follows the target so the shadow map always covers what the player sees.
    const t = this.origin.toLocal(s.x, s.z);
    const span = Math.min(120, s.distance * 1.4 + 20);
    const cam = this.sun.shadow.camera;
    if (cam.right !== span) {
      cam.left = -span;
      cam.right = span;
      cam.top = span;
      cam.bottom = -span;
      cam.updateProjectionMatrix();
    }
    const d = this.sunDir;
    this.sun.position.set(t.x + d.x * 130, d.y * 130, t.z + d.z * 130);
    this.sun.target.position.set(t.x, 0, t.z);

    for (const fn of this.frameListeners) fn(dt);
    this.renderer.render(this.scene, this.camera);
  }

  private resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controller.dispose();
    this.chunks.dispose();
    this.terrain.dispose();
    this.renderer.dispose();
  }
}

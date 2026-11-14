import * as THREE from 'three';
import { CHUNK_SIZE, chunkKey, localIndex, tileToChunk, tileToLocal } from '@/core/coords';
import { TileFlag } from '@/world/biomes';
import { ChunkManager } from '@/world/chunkManager';
import type { ChunkGenerator } from '@/world/genPool';
import { LEVEL_HEIGHT, WATER_Y } from '@/world/terrainMesh';
import { CameraController, type CameraState } from './cameraController';
import { FloatingOrigin } from './floatingOrigin';
import { TerrainRenderer } from './terrainRenderer';

const SKY = new THREE.Color('#9cc9dc');

export interface WorldViewOptions {
  seed: number;
  viewRadius: number;
  generator: ChunkGenerator;
  start?: Partial<CameraState>;
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
  private readonly fog: THREE.Fog;
  private readonly clock = new THREE.Clock();
  private readonly resizeObserver: ResizeObserver;
  private frameListeners: ((dt: number) => void)[] = [];

  constructor(
    private readonly container: HTMLElement,
    opts: WorldViewOptions,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene.background = SKY;
    this.fog = new THREE.Fog(SKY, 100, 300);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.5, 1200);

    this.scene.add(new THREE.HemisphereLight('#dceeff', '#5a6b48', 1.1));
    this.sun = new THREE.DirectionalLight('#fff1d6', 2.0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
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
        onChunkLoaded: (chunk, mesh) => this.terrain.add(chunk, mesh),
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

  get terrainMeshCount(): number {
    return this.terrain.count;
  }

  private frame(): void {
    const dt = Math.min(0.1, this.clock.getDelta());
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
    this.sun.position.set(t.x + 60, 110, t.z + 35);
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

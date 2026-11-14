import * as THREE from 'three';
import type { FloatingOrigin } from './floatingOrigin';

/**
 * City-builder camera: orbits a ground target.
 *
 * Mouse:   left-drag pan · right-drag (or middle) rotate/tilt · wheel zoom
 * Keys:    WASD / arrows pan · Q/E rotate 90° · R/F tilt · Shift = faster
 * Touch:   one finger pan · two fingers pinch zoom and twist rotate
 *
 * The target is kept in world tile coordinates (float64); the three.js camera is placed
 * relative to the floating origin.
 */
export interface CameraState {
  /** World tile coordinates of the point the camera looks at. */
  x: number;
  z: number;
  /** Distance from target, world units. */
  distance: number;
  /** Rotation around the vertical axis, radians. */
  yaw: number;
  /** Angle above the horizon, radians. */
  pitch: number;
}

export const CAMERA_LIMITS = {
  minDistance: 10,
  maxDistance: 110,
  minPitch: THREE.MathUtils.degToRad(28),
  maxPitch: THREE.MathUtils.degToRad(80),
};

export class CameraController {
  readonly state: CameraState;
  /** Where yaw/pitch/distance are easing toward. */
  private goal: CameraState;
  private keys = new Set<string>();
  private pointers = new Map<number, { x: number; y: number; button: number }>();
  private pinch: { dist: number; angle: number } | null = null;
  private readonly ac = new AbortController();
  /** Ground height under the target, set by the game each frame. */
  groundY = 2.5;
  /** Left-drag pans the map. Tools that drag (roads) turn this off while active. */
  panWithLeftButton = true;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly dom: HTMLElement,
    private readonly origin: FloatingOrigin,
    initial: Partial<CameraState> = {},
  ) {
    this.state = {
      x: initial.x ?? 0,
      z: initial.z ?? 0,
      distance: initial.distance ?? 55,
      yaw: initial.yaw ?? Math.PI / 4,
      pitch: initial.pitch ?? THREE.MathUtils.degToRad(50),
    };
    this.goal = { ...this.state };
    this.bind();
  }

  /** Jump to a world position (keeps zoom and angle). */
  teleport(x: number, z: number): void {
    this.state.x = this.goal.x = x;
    this.state.z = this.goal.z = z;
  }

  rotateStep(dir: 1 | -1): void {
    // Snap to the four diagonal views (45°, 135°, ...), the classic isometric angles.
    const step = Math.PI / 2;
    const offset = Math.PI / 4;
    this.goal.yaw = Math.round((this.goal.yaw - offset) / step) * step + offset + dir * step;
  }

  update(dt: number): void {
    // Keyboard pan, scaled by zoom so it feels the same at every distance.
    const speed =
      this.goal.distance *
      1.1 *
      (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 2.5 : 1);
    let fx = 0;
    let fz = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) fz -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) fz += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) fx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) fx += 1;
    if (fx || fz) this.panScreen(fx * speed * dt, fz * speed * dt);
    if (this.keys.has('KeyR')) this.goal.pitch += 1.2 * dt;
    if (this.keys.has('KeyF')) this.goal.pitch -= 1.2 * dt;
    this.clampGoal();

    // Ease toward goal (frame-rate independent).
    const k = 1 - Math.exp(-dt * 12);
    this.state.x += (this.goal.x - this.state.x) * k;
    this.state.z += (this.goal.z - this.state.z) * k;
    this.state.distance += (this.goal.distance - this.state.distance) * k;
    this.state.yaw += (this.goal.yaw - this.state.yaw) * k;
    this.state.pitch += (this.goal.pitch - this.state.pitch) * k;
    this.apply();
  }

  /** Places the three.js camera from the state, relative to the floating origin. */
  apply(): void {
    const { x, z, distance, yaw, pitch } = this.state;
    const t = this.origin.toLocal(x, z);
    const h = Math.cos(pitch) * distance;
    this.camera.position.set(
      t.x + Math.sin(yaw) * h,
      this.groundY + Math.sin(pitch) * distance,
      t.z + Math.cos(yaw) * h,
    );
    this.camera.lookAt(t.x, this.groundY, t.z);
  }

  /** Move the target by a screen-relative offset in world units (+x right, +z toward viewer). */
  private panScreen(dx: number, dz: number): void {
    const s = Math.sin(this.goal.yaw);
    const c = Math.cos(this.goal.yaw);
    this.goal.x += dx * c + dz * s;
    this.goal.z += -dx * s + dz * c;
  }

  private clampGoal(): void {
    const L = CAMERA_LIMITS;
    this.goal.distance = THREE.MathUtils.clamp(this.goal.distance, L.minDistance, L.maxDistance);
    this.goal.pitch = THREE.MathUtils.clamp(this.goal.pitch, L.minPitch, L.maxPitch);
  }

  /** World units per screen pixel at the target, for drag panning. */
  private unitsPerPixel(): number {
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    return (2 * this.state.distance * Math.tan(fov / 2)) / Math.max(1, this.dom.clientHeight);
  }

  private bind(): void {
    const signal = this.ac.signal;
    const el = this.dom;
    el.style.touchAction = 'none';
    el.addEventListener('contextmenu', (e) => e.preventDefault(), { signal });

    el.addEventListener(
      'pointerdown',
      (e) => {
        el.setPointerCapture(e.pointerId);
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, button: e.button });
        this.pinch = this.pointers.size === 2 ? this.pinchInfo() : null;
      },
      { signal },
    );
    el.addEventListener(
      'pointermove',
      (e) => {
        const p = this.pointers.get(e.pointerId);
        if (!p) return;
        const dx = e.clientX - p.x;
        const dy = e.clientY - p.y;
        p.x = e.clientX;
        p.y = e.clientY;
        if (this.pointers.size === 2 && this.pinch) {
          const now = this.pinchInfo();
          if (now) {
            this.goal.distance *= this.pinch.dist / Math.max(1, now.dist);
            this.goal.yaw -= now.angle - this.pinch.angle;
            this.pinch = now;
          }
        } else if (this.pointers.size === 1) {
          if (p.button === 0) {
            if (!this.panWithLeftButton) return;
            const u = this.unitsPerPixel();
            // Dragging moves the world with the cursor; vertical drag is stretched by the tilt.
            this.panScreen(-dx * u, (-dy * u) / Math.max(0.35, Math.sin(this.state.pitch)));
          } else {
            this.goal.yaw -= dx * 0.008;
            this.goal.pitch += dy * 0.006;
          }
        }
        this.clampGoal();
      },
      { signal },
    );
    const up = (e: PointerEvent): void => {
      this.pointers.delete(e.pointerId);
      this.pinch = this.pointers.size === 2 ? this.pinchInfo() : null;
    };
    el.addEventListener('pointerup', up, { signal });
    el.addEventListener('pointercancel', up, { signal });

    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.goal.distance *= Math.exp(e.deltaY * 0.0012);
        this.clampGoal();
      },
      { signal, passive: false },
    );

    window.addEventListener(
      'keydown',
      (e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.code === 'KeyQ' && !e.repeat) this.rotateStep(-1);
        if (e.code === 'KeyE' && !e.repeat) this.rotateStep(1);
        this.keys.add(e.code);
      },
      { signal },
    );
    window.addEventListener('keyup', (e) => this.keys.delete(e.code), { signal });
    window.addEventListener('blur', () => this.keys.clear(), { signal });
  }

  private pinchInfo(): { dist: number; angle: number } | null {
    const [a, b] = [...this.pointers.values()];
    if (!a || !b) return null;
    return { dist: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  dispose(): void {
    this.ac.abort();
  }
}

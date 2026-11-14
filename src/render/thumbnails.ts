import * as THREE from 'three';
import type { BuildingDef } from '@/sim/catalog';
import { ROAD_E, ROAD_N, ROAD_S, ROAD_W, buildingGeometry } from './buildingModels';

/** Render size in pixels; the UI scales the image with CSS. */
const SIZE = 192;

let renderer: THREE.WebGLRenderer | null | undefined;
let scene: THREE.Scene | undefined;
let camera: THREE.OrthographicCamera | undefined;
let material: THREE.MeshLambertMaterial | undefined;
const cache = new Map<string, string>();

function setup(): boolean {
  if (renderer !== undefined) return renderer !== null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(SIZE, SIZE, false);
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#dceeff', '#5a6b48', 1.5));
    const sun = new THREE.DirectionalLight('#fff1d6', 2.2);
    sun.position.set(-3, 6, 4);
    scene.add(sun);
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    material = new THREE.MeshLambertMaterial({ vertexColors: true });
    return true;
  } catch {
    // No WebGL (tests, very old devices): the UI falls back to text only.
    renderer = null;
    return false;
  }
}

/**
 * A small picture of a building as a PNG data URL, rendered once and cached. Returns '' when
 * WebGL is not available. Roads are shown as a crossing so the lamp and lane marks are visible; bridges as a straight span.
 */
export function thumbnail(def: BuildingDef, variant?: number): string {
  const v =
    variant ??
    (def.visual.shape === 'road'
      ? ROAD_E | ROAD_W | ROAD_S | ROAD_N
      : def.visual.shape === 'bridge'
        ? ROAD_E | ROAD_W
        : 0);
  const key = `${def.id}#${v}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (!setup() || !renderer || !scene || !camera || !material) return '';
  try {
    const geo = buildingGeometry(def, v);
    const { w, d } = def.footprint;
    const group = new THREE.Group();
    // A grass plate so the building does not float.
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.5, 0.12, d + 0.5),
      new THREE.MeshLambertMaterial({ color: '#86b25c' }),
    );
    plate.position.set(w / 2, -0.06, d / 2);
    group.add(plate, new THREE.Mesh(geo, material));
    scene.add(group);
    // Isometric view from the south-east, framed on the plate and the building height.
    geo.computeBoundingBox();
    const top = geo.boundingBox?.max.y ?? 1;
    const target = new THREE.Vector3(w / 2, top / 2, d / 2);
    const radius = Math.max(Math.hypot(w + 0.5, d + 0.5) / 2, top * 0.75, 0.9) * 1.15;
    camera.left = -radius;
    camera.right = radius;
    camera.top = radius;
    camera.bottom = -radius;
    camera.updateProjectionMatrix();
    camera.position.copy(target).add(new THREE.Vector3(8, 7.5, 8));
    camera.lookAt(target);
    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    scene.remove(group);
    plate.geometry.dispose();
    (plate.material as THREE.Material).dispose();
    cache.set(key, url);
    return url;
  } catch {
    cache.set(key, '');
    return '';
  }
}

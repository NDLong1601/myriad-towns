// Dev-only turntable for building models: /tools/building-preview.html?ids=a,b&yaw=45&night=0
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BuildingDef } from '@/sim/catalog';
import { architectureModel } from '@/render/architectureModels';
import { DAY_BOUNCE, DAY_FILL, DAY_SKY, DAY_SUN, visualDefinition } from '@/render/visualPalette';

const files = import.meta.glob('../data/buildings/*.json', { eager: true, import: 'default' });
const defs = new Map<string, BuildingDef>();
for (const list of Object.values(files) as BuildingDef[][]) for (const d of list) defs.set(d.id, d);
const extra: Record<string, Partial<BuildingDef>> = {
  open_air_stage: { visual: { shape: 'block', color: '#d6cbb3', roof: '#4b5a67', height: 0.6 } },
  playhouse: { visual: { shape: 'block', color: '#a65038', roof: '#4b5a67', height: 0.9 } },
  opera_house: { visual: { shape: 'block', color: '#e6dcc7', roof: '#4b5a67', height: 1.2 } },
} as never;

const q = new URLSearchParams(location.search);
const ids = (q.get('ids') ?? 'open_air_stage,playhouse,opera_house').split(',');
const yaw = (Number(q.get('yaw') ?? 45) * Math.PI) / 180;
const night = q.get('night') === '1';
const zoom = Number(q.get('zoom') ?? 1);
const pitch = Number(q.get('pitch') ?? 35);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(night ? '#1d2840' : DAY_SKY);
scene.add(
  new THREE.HemisphereLight(
    night ? '#4a5a86' : DAY_FILL,
    night ? '#1b1d24' : DAY_BOUNCE,
    night ? 0.7 : 1.32,
  ),
);
const sun = new THREE.DirectionalLight(night ? '#8fa2d6' : DAY_SUN, night ? 0.5 : 1.78);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.01;
scene.add(sun, sun.target);

const material = new THREE.MeshLambertMaterial({ vertexColors: true });
material.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vGlow;')
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.55, 0.18) * vGlow * ${night ? '1.3' : '0.0'};`,
    );
};

let x = 0;
const gap = 0.6;
const group = new THREE.Group();
for (const id of ids) {
  const base =
    defs.get(id) ??
    ({ id, category: 'food', footprint: { w: 2, d: 2 }, visual: { shape: 'hall' } } as BuildingDef);
  const def = visualDefinition({ ...base, ...extra[id] } as BuildingDef);
  const parts: THREE.BufferGeometry[] = [];
  if (!architectureModel(def, parts)) continue;
  const geo = mergeGeometries(parts, false);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(x, 0, 0);
  group.add(mesh);
  x += def.footprint.w + gap;
}
const total = x - gap;
group.position.x = -total / 2;
scene.add(group);
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2),
  new THREE.MeshLambertMaterial({ color: night ? '#3c4a3a' : '#93a86c' }),
);
ground.position.set(0, -0.002, 1);
ground.receiveShadow = true;
scene.add(ground);

const box = new THREE.Box3().setFromObject(group);
const center = box.getCenter(new THREE.Vector3());
const size = box.getSize(new THREE.Vector3());
const aspect = innerWidth / innerHeight;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
const p = (pitch * Math.PI) / 180;
camera.position
  .copy(center)
  .add(
    new THREE.Vector3(
      Math.sin(yaw) * Math.cos(p),
      Math.sin(p),
      Math.cos(yaw) * Math.cos(p),
    ).multiplyScalar(40),
  );
camera.lookAt(center);
camera.updateMatrixWorld();
const view = new THREE.Box3();
for (const cx of [box.min.x, box.max.x])
  for (const cy of [box.min.y, box.max.y])
    for (const cz of [box.min.z, box.max.z])
      view.expandByPoint(new THREE.Vector3(cx, cy, cz).applyMatrix4(camera.matrixWorldInverse));
const vc = view.getCenter(new THREE.Vector3());
let hw = ((view.max.x - view.min.x) / 2) * 1.06;
let hh = ((view.max.y - view.min.y) / 2) * 1.06;
if (hw / hh > aspect) hh = hw / aspect;
else hw = hh * aspect;
hw /= zoom;
hh /= zoom;
Object.assign(camera, { left: vc.x - hw, right: vc.x + hw, top: vc.y + hh, bottom: vc.y - hh });
camera.updateProjectionMatrix();
sun.position.copy(center).add(new THREE.Vector3(-6, 9, 7));
sun.target.position.copy(center);
const s = Math.max(size.x, size.z);
Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 0.1, far: 50 });
sun.shadow.camera.updateProjectionMatrix();
renderer.render(scene, camera);
(window as unknown as { __ready: boolean }).__ready = true;

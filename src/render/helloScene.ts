import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CHUNK_AREA, CHUNK_SIZE, indexToLocal, localToTile } from '@/core/coords';
import { hash32, hashFloat, Purpose } from '@/core/prng';

/**
 * M0 placeholder scene: one 32×32 chunk of tiles whose heights and colors come from the
 * seeded hash, plus a few "houses". It proves the stack (Vite + TS + three + coords + prng)
 * works end to end. M1 replaces it with the real chunk renderer.
 */
export interface HelloScene {
  renderer: THREE.WebGLRenderer;
  dispose(): void;
}

const GRASS = [new THREE.Color('#7fb069'), new THREE.Color('#8cbf6e'), new THREE.Color('#6fa35c')];
const SAND = new THREE.Color('#e6d3a3');
const WATER = new THREE.Color('#4f9dc2');

export function createHelloScene(container: HTMLElement, seed: number): HelloScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#8fc1d4');
  scene.fog = new THREE.Fog('#8fc1d4', 60, 140);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    500,
  );
  camera.position.set(34, 30, 34);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.45;
  controls.minDistance = 8;
  controls.maxDistance = 120;

  scene.add(new THREE.HemisphereLight('#dff3ff', '#5d7a4a', 1.4));
  const sun = new THREE.DirectionalLight('#fff4dc', 2.2);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24 });
  scene.add(sun);

  // Tiles: one InstancedMesh for the whole chunk (1 draw call).
  const tileGeo = new THREE.BoxGeometry(1, 1, 1);
  tileGeo.translate(0, 0.5, 0);
  const tileMat = new THREE.MeshLambertMaterial({ flatShading: true });
  const tiles = new THREE.InstancedMesh(tileGeo, tileMat, CHUNK_AREA);
  tiles.receiveShadow = true;

  const m = new THREE.Matrix4();
  const half = CHUNK_SIZE / 2;
  const houseSpots: { x: number; z: number; h: number }[] = [];
  for (let i = 0; i < CHUNK_AREA; i++) {
    const { lx, lz } = indexToLocal(i);
    const { x, z } = localToTile(0, 0, lx, lz);
    // Smooth-ish bumps from a few hashed sine waves; real noise arrives in M1.
    const n =
      Math.sin((x + hashFloat(seed, Purpose.Elevation) * 50) * 0.21) +
      Math.cos((z + hashFloat(seed, Purpose.Moisture) * 50) * 0.17) +
      hashFloat(seed, Purpose.Elevation, x, z) * 0.6;
    const level = n < -0.9 ? 0 : n < -0.6 ? 1 : 1 + Math.floor((n + 0.6) * 1.2);
    const height = 0.4 + level * 0.35;
    m.makeScale(1, height, 1);
    m.setPosition(lx - half + 0.5, 0, lz - half + 0.5);
    tiles.setMatrixAt(i, m);
    const color =
      level === 0 ? WATER : level === 1 ? SAND : (GRASS[hash32(seed, x, z) % GRASS.length] ?? SAND);
    tiles.setColorAt(i, color);
    if (level >= 2 && hashFloat(seed, Purpose.PointsOfInterest, x, z) < 0.06) {
      houseSpots.push({ x: lx - half + 0.5, z: lz - half + 0.5, h: height });
    }
  }
  scene.add(tiles);

  // Houses: body + roof, each one InstancedMesh.
  const bodyGeo = new THREE.BoxGeometry(0.7, 0.6, 0.7);
  bodyGeo.translate(0, 0.3, 0);
  const roofGeo = new THREE.ConeGeometry(0.62, 0.45, 4);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.translate(0, 0.82, 0);
  const bodies = new THREE.InstancedMesh(
    bodyGeo,
    new THREE.MeshLambertMaterial({ color: '#f2efe6', flatShading: true }),
    Math.max(houseSpots.length, 1),
  );
  const roofs = new THREE.InstancedMesh(
    roofGeo,
    new THREE.MeshLambertMaterial({ color: '#c0543c', flatShading: true }),
    Math.max(houseSpots.length, 1),
  );
  bodies.count = roofs.count = houseSpots.length;
  houseSpots.forEach((s, i) => {
    m.makeTranslation(s.x, s.h, s.z);
    bodies.setMatrixAt(i, m);
    roofs.setMatrixAt(i, m);
  });
  for (const mesh of [bodies, roofs]) {
    mesh.castShadow = true;
    scene.add(mesh);
  }

  const onResize = (): void => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener('resize', onResize);

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    renderer,
    dispose() {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
    },
  };
}

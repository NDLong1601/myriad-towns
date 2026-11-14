import './style.css';
import { seedFromString } from '@/core/prng';
import { GEN_VERSION } from '@/core/version';
import { createHelloScene } from '@/render/helloScene';

declare global {
  interface Window {
    /** Set once the first frame is rendered; used by the Playwright smoke test. */
    __MYRIAD_READY__?: { seed: number; genVersion: number };
  }
}

const app = document.getElementById('app');
const hud = document.getElementById('hud');
if (!app || !hud) throw new Error('index.html is missing #app or #hud');

// ?seed=<text> picks the world; the default keeps screenshots stable.
const seedText = new URLSearchParams(window.location.search).get('seed') ?? 'myriad';
const seed = seedFromString(seedText);

const { renderer } = createHelloScene(app, seed);

hud.innerHTML = `<strong>Myriad Towns</strong><br>M0 · seed "${escapeHtml(seedText)}" (${seed}) · gen v${GEN_VERSION}<br>Kéo để xoay, cuộn để zoom`;

requestAnimationFrame(() => {
  window.__MYRIAD_READY__ = { seed, genVersion: GEN_VERSION };
  document.body.dataset.ready = String(renderer.getContext() !== null);
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

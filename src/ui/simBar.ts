import { LABOR_TIERS } from '@/sim/catalog';
import { TICKS_PER_DAY } from '@/render/dayNight';
import { type SimClock, SPEEDS, type Speed } from '@/sim/clock';
import type { Simulation } from '@/sim/simulation';
import { fmt, t } from './i18n';
import { icon } from './icons';

/** Calendar and speed controls by the map; population and labour beside the stockpile. */
export function mountSimBar(
  sim: Simulation,
  clock: SimClock,
  parent: HTMLElement,
  readouts: HTMLElement,
): () => void {
  const el = document.createElement('div');
  el.className = 'mt-clock';
  el.innerHTML = `<div class="mt-speeds">${SPEEDS.map(
    (s) =>
      `<button data-speed="${s}" title="${t(s === 0 ? 'ui.pause' : 'ui.speed', { n: s })}">${s === 0 ? '⏸' : `${s}×`}</button>`,
  ).join('')}</div><div class="mt-calendar"></div>`;
  parent.appendChild(el);
  const stats = document.createElement('div');
  stats.className = 'mt-simbar';
  const pop = document.createElement('div');
  pop.className = 'mt-pop';
  stats.appendChild(pop);
  readouts.prepend(stats);
  const date = el.querySelector<HTMLElement>('.mt-calendar')!;

  const renderSpeed = (): void => {
    for (const b of el.querySelectorAll<HTMLButtonElement>('[data-speed]')) {
      const active = Number(b.dataset.speed) === clock.speed;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    }
  };
  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-speed]');
    if (!b) return;
    clock.setSpeed(Number(b.dataset.speed) as Speed);
    renderSpeed();
  });
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  window.addEventListener('keydown', (e) => {
    if (
      e.code !== 'Space' ||
      document.querySelector('dialog[open], [aria-modal="true"]:not([hidden], [hidden] *)') ||
      (e.target instanceof Element &&
        e.target.closest('button, input, select, textarea, [contenteditable], .mt-resources'))
    )
      return;
    e.preventDefault();
    clock.togglePause();
    renderSpeed();
  });

  const render = (): void => {
    const day = t('launch.dayCount', { n: Math.floor(sim.tick / TICKS_PER_DAY) + 1 });
    if (date.textContent !== day) date.textContent = day;
    const f = sim.flows;
    const labor = LABOR_TIERS.filter(
      (tier) => (f.laborTotal[tier] ?? 0) > 0 || (f.laborUsed[tier] ?? 0) > 0,
    )
      .map((tier) => {
        const used = f.laborUsed[tier] ?? 0;
        const total = f.laborTotal[tier] ?? 0;
        const warning = (used === 0 && total > 0) || (used > 0 && used >= total);
        return `<span class="mt-labor${warning ? ' warning' : ''}" title="${t(`resource.${tier}`)}">${icon(tier)}<b>${fmt(used)}/${fmt(total)}</b></span>`;
      })
      .join('');
    const html = `<span class="mt-population">${t('ui.population')} <b>${fmt(f.population)}</b></span>${labor}`;
    if (html !== last) {
      pop.innerHTML = html;
      last = html;
    }
  };
  let last = '';
  renderSpeed();
  render();
  // Also refresh while paused (ticks can be run from tools) — cheap, a few spans.
  setInterval(render, 500);
  return render;
}

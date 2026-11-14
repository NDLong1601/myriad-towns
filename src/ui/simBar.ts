import { LABOR_TIERS } from '@/sim/catalog';
import { type SimClock, SPEEDS, type Speed } from '@/sim/clock';
import type { Simulation } from '@/sim/simulation';
import { fmt, t } from './i18n';

/** Top-centre bar: pause / speed buttons, population and labour use. Space toggles pause. */
export function mountSimBar(sim: Simulation, clock: SimClock, parent: HTMLElement): () => void {
  const el = document.createElement('div');
  el.className = 'mt-simbar';
  el.innerHTML = `<div class="mt-speeds">${SPEEDS.map(
    (s) =>
      `<button data-speed="${s}" title="${t(s === 0 ? 'ui.pause' : 'ui.speed', { n: s })}">${s === 0 ? '⏸' : `${s}×`}</button>`,
  ).join('')}</div><div class="mt-pop"></div>`;
  parent.appendChild(el);
  const pop = el.querySelector('.mt-pop') as HTMLElement;

  const renderSpeed = (): void => {
    for (const b of el.querySelectorAll<HTMLButtonElement>('[data-speed]')) {
      b.classList.toggle('active', Number(b.dataset.speed) === clock.speed);
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
    if (e.code !== 'Space' || e.target instanceof HTMLInputElement) return;
    e.preventDefault();
    clock.togglePause();
    renderSpeed();
  });

  const render = (): void => {
    const f = sim.flows;
    const labor = LABOR_TIERS.filter(
      (tier) => (f.laborTotal[tier] ?? 0) > 0 || (f.laborUsed[tier] ?? 0) > 0,
    )
      .map((tier) => {
        const used = f.laborUsed[tier] ?? 0;
        const total = f.laborTotal[tier] ?? 0;
        return `<span class="${used >= total && total > 0 ? 'full' : ''}" title="${t(`resource.${tier}`)}">${t(`resource.${tier}`)} <b>${fmt(used)}/${fmt(total)}</b></span>`;
      })
      .join('');
    pop.innerHTML = `<span>${t('ui.population')} <b>${fmt(f.population)}</b></span>${labor}`;
  };
  renderSpeed();
  render();
  // Also refresh while paused (ticks can be run from tools) — cheap, a few spans.
  setInterval(render, 500);
  return render;
}

import type { Simulation } from '@/sim/simulation';
import { MIN_TOWN_GAP, type TownStore } from '@/sim/towns';
import { fmt, t } from './i18n';

/** Display name of a town: a name from the list, numbered once the list runs out. */
export function townName(id: number): string {
  const base = t(`town.name.${((id - 1) % 8) + 1}`);
  return id > 8 ? `${base} ${Math.ceil(id / 8)}` : base;
}

function happinessIcon(h: number): string {
  if (h >= 80) return '😄';
  if (h >= 60) return '🙂';
  if (h >= 40) return '😐';
  return '😟';
}

/** Left-column list of towns: population, asleep or not; click to fly there. */
export function mountTownsPanel(
  towns: TownStore,
  sim: Simulation,
  parent: HTMLElement,
  goTo: (x: number, z: number) => void,
): () => void {
  const el = document.createElement('section');
  el.className = 'mt-goals mt-towns';
  parent.appendChild(el);
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-town]');
    const town = b && towns.get(Number(b.dataset.town));
    if (town) goTo(town.x, town.z);
  });
  let last = '';
  const render = (): void => {
    const list = towns.all();
    el.hidden = list.length === 0;
    // Phones hide the panel while there is only one town (the hint is not worth the space).
    el.classList.toggle('single', list.length < 2);
    const html = `<h3>${t('towns.title')}</h3><ul>${list
      .map((tw) => {
        const asleep = sim.isDormant(tw.id);
        const icon = happinessIcon(tw.happiness);
        return `<li><button type="button" data-town="${tw.id}" title="${t('towns.goTo')}">${townName(tw.id)} · ${t('towns.pop', { pop: fmt(tw.population) })} · <span title="${t('towns.happiness')} ${tw.happiness}%">${icon} ${tw.happiness}%</span>${
          asleep ? ` <em title="${t('towns.dormantHint')}">💤 ${t('towns.dormant')}</em>` : ''
        }</button></li>`;
      })
      .join(
        '',
      )}</ul>${list.length < 2 ? `<small>${t('towns.hint', { gap: MIN_TOWN_GAP })}</small>` : ''}`;
    if (html !== last) {
      el.innerHTML = html;
      last = html;
    }
  };
  towns.on(render);
  render();
  return render;
}

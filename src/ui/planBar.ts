import type { History } from '@/sim/commands';
import type { PlanStore } from '@/sim/plan';
import { formatAmounts, t } from './i18n';

/** Plan mode toggle (P) and, while there are plans, their total cost with Build / Clear. */
export function mountPlanBar(plans: PlanStore, history: History, parent: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'mt-planbar';
  parent.appendChild(el);
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!b) return;
    if (b.dataset.act === 'mode') plans.setMode(!plans.mode);
    else if (b.dataset.act === 'build') plans.build(history);
    else if (b.dataset.act === 'clear') plans.clear();
  });
  const render = (): void => {
    const n = plans.count;
    el.classList.toggle('on', plans.mode);
    el.innerHTML =
      `<button data-act="mode" class="${plans.mode ? 'active' : ''}" title="${t('ui.planHint')}">📐 ${t('ui.plan')}</button>` +
      (n
        ? `<span>${t('ui.planCount', { n })} · ${formatAmounts(plans.totalCost())}</span>` +
          `<button data-act="build">${t('ui.planBuild')}</button><button data-act="clear">${t('ui.planClear')}</button>`
        : plans.mode
          ? `<span>${t('ui.planHint')}</span>`
          : '');
  };
  plans.on(render);
  render();
}

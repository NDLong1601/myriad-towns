import type { History } from '@/sim/commands';
import type { PlanStore } from '@/sim/plan';
import { formatAmounts, t } from './i18n';

/** Plan mode toggle (P) and, while there are plans, their total cost with Build / Clear. */
export function mountPlanBar(
  plans: PlanStore,
  history: History,
  parent: HTMLElement,
  toolbar: HTMLElement,
): void {
  const el = document.createElement('div');
  el.className = 'mt-planbar';
  el.id = 'mt-plan-details';
  parent.appendChild(el);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'mt-plan-btn';
  toggle.title = t('ui.plan');
  toggle.setAttribute('aria-label', t('ui.plan'));
  toggle.setAttribute('aria-controls', el.id);
  toggle.innerHTML =
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V3l18 18H3Z"/><path d="M7 17v-4l4 4H7ZM3 8h2m-2 4h2m-2 4h2"/></svg>';
  toolbar.appendChild(toggle);
  toggle.addEventListener('pointerdown', (e) => e.stopPropagation());
  toggle.addEventListener('click', () => plans.setMode(!plans.mode));
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!b) return;
    if (b.dataset.act === 'build') plans.build(history);
    else if (b.dataset.act === 'clear') plans.clear();
  });
  const render = (): void => {
    const n = plans.count;
    el.classList.toggle('on', plans.mode);
    el.hidden = !n && !plans.mode;
    toggle.setAttribute('aria-pressed', String(plans.mode));
    el.innerHTML = n
      ? `<span>${t('ui.planCount', { n })} · ${formatAmounts(plans.totalCost())}</span>` +
        `<button data-act="build">${t('ui.planBuild')}</button><button data-act="clear">${t('ui.planClear')}</button>`
      : plans.mode
        ? `<span>${t('ui.planHint')}</span>`
        : '';
  };
  plans.on(render);
  render();
}

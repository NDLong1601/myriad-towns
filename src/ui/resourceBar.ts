import { STOCK_RESOURCES } from '@/sim/catalog';
import type { City } from '@/sim/city';
import { netFlows, type Simulation } from '@/sim/simulation';
import { getLang, t } from './i18n';
import { icon } from './icons';

/**
 * Stockpile chips in the top-right corner, each with its net change per second.
 * Resources at 0 that nothing uses yet are hidden.
 */
export function mountResourceBar(city: City, parent: HTMLElement, sim?: Simulation): void {
  const el = document.createElement('div');
  el.className = 'mt-resources';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', t('ui.resources'));
  el.tabIndex = 0;
  const locale = getLang();
  const stockNumber = new Intl.NumberFormat(locale);
  const rateNumber = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    signDisplay: 'always',
  });
  parent.appendChild(el);
  const always = new Set(['food', 'wood', 'stone']);
  const render = (): void => {
    const net = sim ? netFlows(sim.flows) : {};
    el.innerHTML = STOCK_RESOURCES.filter(
      (r) => always.has(r) || (city.stock[r] ?? 0) !== 0 || (net[r] ?? 0) !== 0,
    )
      .map((r) => {
        const n = net[r] ?? 0;
        const rate =
          Math.abs(n) < 0.05
            ? ''
            : `<i class="${n > 0 ? 'up' : 'down'}">${rateNumber.format(n)}${t('ui.perSecond')}</i>`;
        const stock = Math.floor(city.stock[r] ?? 0);
        const cap = city.capacityOf(r);
        const isFull = stock >= cap;
        const full = `${stockNumber.format(stock)} / ${stockNumber.format(cap)}`;
        const status = isFull ? ` · ${t('ui.stockFull')}` : '';
        return `<span data-res="${r}" class="${isFull ? 'full' : ''}" title="${t(`resource.${r}`)} · ${full}${status}">${icon(r)}<b>${full}</b>${rate}</span>`;
      })
      .join('');
  };
  city.on((e) => {
    if (e.type === 'stock') render();
  });
  render();
}

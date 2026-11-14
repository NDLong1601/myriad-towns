import { STOCK_RESOURCES } from '@/sim/catalog';
import type { City } from '@/sim/city';
import { fmt, t } from './i18n';

/** Stockpile chips in the top-right corner. Resources at 0 that nothing uses yet are hidden. */
export function mountResourceBar(city: City, parent: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'mt-resources';
  el.setAttribute('aria-label', 'resources');
  parent.appendChild(el);
  const always = new Set(['food', 'wood', 'stone']);
  const render = (): void => {
    el.innerHTML = STOCK_RESOURCES.filter((r) => always.has(r) || (city.stock[r] ?? 0) !== 0)
      .map(
        (r) =>
          `<span data-res="${r}">${t(`resource.${r}`)}<b>${fmt(city.stock[r] ?? 0)}</b></span>`,
      )
      .join('');
  };
  city.on((e) => {
    if (e.type === 'stock') render();
  });
  render();
}

import { STOCK_RESOURCES } from '@/sim/catalog';
import type { City, PlacedBuilding } from '@/sim/city';
import { type Simulation } from '@/sim/simulation';
import { getLang, t } from '@/ui/i18n';
import { icon } from '@/ui/icons';
import { mountEconomyPanel } from '@/ui/panels/economyPanel';

/** Stockpile chips in the top-right corner, each with its net change per second. */
export function mountResourceBar(
  city: City,
  parent: HTMLElement,
  sim?: Simulation,
  focus?: (x: number, z: number) => void,
  usesSharedStock?: (building: PlacedBuilding, resource: string) => boolean,
): void {
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
  const panel = mountEconomyPanel(city, sim, focus, usesSharedStock);
  const always = new Set(['food', 'wood', 'stone']);
  const chips = STOCK_RESOURCES.map((resource) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.res = resource;
    const name = t(`resource.${resource}`);
    button.setAttribute('aria-label', name);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', panel.id);
    button.innerHTML = icon(resource);
    button.firstElementChild?.setAttribute('aria-hidden', 'true');
    const amount = document.createElement('b');
    const rate = document.createElement('i');
    button.append(amount, rate);
    button.addEventListener('click', () => panel.open(resource));
    el.append(button);
    return { resource, name, button, amount, rate };
  });

  function render(): void {
    const flows = sim?.sharedFlows;
    for (const { resource, name, button, amount, rate } of chips) {
      const stored = city.stock[resource] ?? 0;
      const produced = flows?.produced[resource] ?? 0;
      const consumed = flows?.consumed[resource] ?? 0;
      const net = produced - consumed;
      button.hidden =
        !always.has(resource) &&
        stored === 0 &&
        produced === 0 &&
        consumed === 0 &&
        document.activeElement !== button;
      if (button.hidden) {
        button.classList.remove('full');
        continue;
      }
      const stock = Math.floor(stored);
      const cap = city.capacityOf(resource);
      const isFull = stock >= cap;
      const full = `${stockNumber.format(stock)} / ${stockNumber.format(cap)}`;
      const status = isFull ? ` · ${t('ui.stockFull')}` : '';
      button.classList.toggle('full', isFull);
      button.title = `${name} · ${full}${status}`;
      if (amount.textContent !== full) amount.textContent = full;
      rate.hidden = Math.abs(net) < 0.05;
      if (!rate.hidden) {
        const text = rateNumber.format(net) + t('ui.perSecond');
        rate.className = net > 0 ? 'up' : 'down';
        if (rate.textContent !== text) rate.textContent = text;
      }
    }
    panel.refresh();
  }
  city.on((event) => {
    if (event.type === 'stock') render();
  });
  render();
}

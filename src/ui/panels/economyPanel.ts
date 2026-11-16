import type { City, PlacedBuilding } from '@/sim/city';
import type { Simulation } from '@/sim/simulation';
import { describeCheck } from '@/ui/describe';
import { buildingName, getLang, t } from '@/ui/i18n';
import '@/ui/panels/economyPanel.css';

const MAX_SITES = 8;

interface Site {
  building: PlacedBuilding;
  rate: number;
  status: string;
}

function siteStatus(city: City, sim: Simulation | undefined, b: PlacedBuilding): string {
  if (sim?.tiers && sim.isDormant(sim.tiers.townOfBuilding(b))) return t('economy.dormant');
  const inactive = !city.isActive(b.uid);
  const state = sim?.stateOf(b.uid);
  if (sim && b.def.voyage && !sim.voyageRouteOf(b.uid)?.length) return t('economy.noRoute');
  if (sim && (inactive || (state && (!state.staffed || !state.supplied)))) {
    const reasons = sim.problemsOf(b.uid).map((p) => {
      if (p.kind === 'requirement') return describeCheck(p.check);
      if (p.kind === 'labor') return t('alert.labor', { resource: t(`resource.${p.tier}`) });
      return t('alert.input', { resource: t(`resource.${p.resource}`) });
    });
    if (reasons.length) return reasons.join(' · ');
  }
  return inactive ? t('economy.inactive') : '';
}

export function mountEconomyPanel(
  city: City,
  sim?: Simulation,
  focus?: (x: number, z: number) => void,
  usesSharedStock?: (building: PlacedBuilding, resource: string) => boolean,
): { id: string; open(resource: string): void; refresh(): void } {
  const number = new Intl.NumberFormat(getLang(), { maximumFractionDigits: 2 });
  const dialog = document.createElement('dialog');
  dialog.id = 'mt-economy';
  dialog.className = 'mt-economy';
  dialog.setAttribute('aria-labelledby', 'mt-economy-title');
  dialog.addEventListener('keydown', (event) => event.stopPropagation());
  const header = document.createElement('header');
  const title = document.createElement('h2');
  title.id = 'mt-economy-title';
  const close = document.createElement('button');
  close.type = 'button';
  close.autofocus = true;
  close.textContent = t('ui.close');
  close.addEventListener('click', () => dialog.close());
  header.append(title, close);
  const stats = document.createElement('dl');
  function metric(key: string): HTMLElement {
    const group = document.createElement('div');
    const label = document.createElement('dt');
    label.textContent = t(key);
    const value = document.createElement('dd');
    group.append(label, value);
    stats.append(group);
    return value;
  }
  const stockValue = metric('economy.stock');
  const producedValue = metric('economy.produced');
  const consumedValue = metric('economy.consumed');
  const forecast = document.createElement('p');
  forecast.className = 'mt-economy-forecast';
  const note = document.createElement('p');
  note.textContent = t('economy.rates');
  dialog.append(header, stats, forecast, note);
  const sources = mountSites('economy.sources');
  const consumers = mountSites('economy.consumers');
  document.body.append(dialog);
  let resource = '';

  function mountSites(key: string): (sites: Site[]) => void {
    const section = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = t(key);
    const list = document.createElement('ul');
    section.append(heading, list);
    dialog.append(section);
    let signature = '';
    return (sites) => {
      sites.sort(
        (a, b) => Number(Boolean(b.status)) - Number(Boolean(a.status)) || b.rate - a.rate,
      );
      const shown = sites.slice(0, MAX_SITES);
      const next = JSON.stringify([
        sites.length,
        ...shown.map(({ building, rate, status }) => [building.uid, building.def.id, rate, status]),
      ]);
      if (next === signature) return;
      signature = next;
      const focused = document.activeElement;
      const selected =
        focused instanceof HTMLButtonElement && list.contains(focused)
          ? focused.dataset.uid
          : undefined;
      list.replaceChildren();
      let replacement: HTMLButtonElement | undefined;
      for (const { building, rate, status } of shown) {
        const row = document.createElement('li');
        const entry = focus ? document.createElement('button') : document.createElement('div');
        const name = buildingName(building.def.id);
        const label = document.createElement('span');
        label.textContent = name;
        const amount = document.createElement('b');
        amount.textContent = number.format(rate) + t('ui.perSecond');
        entry.append(label, amount);
        if (status) {
          const info = document.createElement('small');
          info.textContent = status;
          entry.append(info);
        }
        if (entry instanceof HTMLButtonElement && focus) {
          entry.type = 'button';
          entry.dataset.uid = String(building.uid);
          entry.setAttribute(
            'aria-label',
            [t('economy.navigate', { building: name }), amount.textContent, status]
              .filter(Boolean)
              .join(' · '),
          );
          entry.addEventListener('click', () => {
            const target = city.get(building.uid);
            if (!target) return;
            dialog.close();
            focus(target.x + target.def.footprint.w / 2, target.z + target.def.footprint.d / 2);
          });
          if (entry.dataset.uid === selected) replacement = entry;
        }
        row.append(entry);
        list.append(row);
      }
      if (!sites.length || sites.length > MAX_SITES) {
        const remaining = document.createElement('li');
        remaining.textContent = sites.length
          ? t('economy.more', { n: sites.length - MAX_SITES })
          : t('economy.noSites');
        list.append(remaining);
      }
      if (selected) (replacement ?? close).focus();
    };
  }

  function refresh(): void {
    if (!dialog.open) return;
    const stock = city.stock[resource] ?? 0;
    const flows = sim?.sharedFlows;
    const produced = flows?.produced[resource] ?? 0;
    const consumed = flows?.consumed[resource] ?? 0;
    stockValue.textContent = `${number.format(Math.floor(stock))} / ${number.format(city.capacityOf(resource))}`;
    producedValue.textContent = number.format(produced) + t('ui.perSecond');
    consumedValue.textContent = number.format(consumed) + t('ui.perSecond');
    const drain = consumed - produced;
    forecast.classList.toggle('warning', stock <= 0 || drain > 0.001);
    forecast.textContent =
      stock <= 0
        ? t('economy.empty')
        : drain > 0.001
          ? t('economy.depletion', { n: number.format(Math.ceil(stock / drain)) })
          : t('economy.stable');

    const producers: Site[] = [];
    const users: Site[] = [];
    for (const building of city.all()) {
      const out = building.def.produces?.[resource] ?? 0;
      const input = building.def.upkeep?.[resource] ?? 0;
      if ((!out && !input) || (usesSharedStock && !usesSharedStock(building, resource))) continue;
      const status = siteStatus(city, sim, building);
      if (out) producers.push({ building, rate: out, status });
      if (input) users.push({ building, rate: input, status });
    }
    sources(producers);
    consumers(users);
  }

  return {
    id: dialog.id,
    open(selected) {
      resource = selected;
      title.textContent = t('economy.title', { resource: t(`resource.${resource}`) });
      dialog.showModal();
      dialog.scrollTop = 0;
      refresh();
    },
    refresh,
  };
}

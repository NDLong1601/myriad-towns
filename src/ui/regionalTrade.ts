import type { City } from '@/sim/city';
import { TICK_HZ } from '@/sim/clock';
import {
  TRADE_RESOURCES,
  TOWN_ROLES,
  LOCAL_POLICIES,
  type LocalPolicy,
  type RegionalTrade,
  type TownRole,
  type TradeResource,
} from '@/sim/regionalTrade';
import type { TownStore } from '@/sim/towns';
import { buildingName, fmt, t } from '@/ui/i18n';
import { townName } from '@/ui/townsPanel';
import '@/ui/panels/regionalTrade.css';

export function mountRegionalTrade(
  city: City,
  towns: TownStore,
  trade: RegionalTrade,
  parent: HTMLElement,
): void {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mt-regional-button';
  button.textContent = t('trade.title');
  button.setAttribute('aria-haspopup', 'dialog');
  parent.appendChild(button);

  button.addEventListener('click', () => {
    const dialog = document.createElement('dialog');
    dialog.className = 'mt-regional';
    dialog.setAttribute('aria-labelledby', 'mt-regional-title');
    dialog.innerHTML = `
      <header><h2 id="mt-regional-title">${t('trade.title')}</h2>
      <button type="button" data-close>${t('trade.close')}</button></header>
      <label>${t('trade.town')} <select data-town></select></label>
      <section data-local hidden>
        <label>${t('trade.role')} <select data-role></select></label>
        <p data-effects></p>
        <label>${t('trade.policy')} <select data-policy></select></label>
        <p data-policy-effects></p>
        <button type="button" data-reserve></button>
        <div data-stock hidden>
          <p>${t('trade.stockHint')}</p>
          <label>${t('trade.resource')} <select data-resource></select></label>
          <label>${t('trade.amount')} <input data-quantity type="number" min="1" max="1000" value="25"></label>
          <p data-quantity-info></p>
          <div class="mt-regional-actions">
            <button type="button" data-deposit>${t('trade.deposit')}</button>
            <button type="button" data-withdraw>${t('trade.withdraw')}</button>
          </div>
        </div>
      </section>
      <section>
        <h3>${t('trade.routes')}</h3>
        <p>${t('trade.routeHint')}</p>
        <form>
          <label>${t('trade.from')} <select data-from required></select></label>
          <label>${t('trade.to')} <select data-to required></select></label>
          <label>${t('trade.resource')} <select data-cargo></select></label>
          <label>${t('trade.shipAmount')} <input name="amount" type="number" min="1" max="600" value="25" required></label>
          <label>${t('trade.keep')} <input name="keep" type="number" min="0" max="600" value="25" required></label>
          <button type="submit">${t('trade.add')}</button>
        </form>
        <ul data-routes></ul>
      </section>
      <p role="status"></p>
    `;
    const get = <E extends HTMLElement>(selector: string): E => dialog.querySelector<E>(selector)!;
    const town = get<HTMLSelectElement>('[data-town]');
    const role = get<HTMLSelectElement>('[data-role]');
    const policy = get<HTMLSelectElement>('[data-policy]');
    const resource = get<HTMLSelectElement>('[data-resource]');
    const cargo = get<HTMLSelectElement>('[data-cargo]');
    const source = get<HTMLSelectElement>('[data-from]');
    const target = get<HTMLSelectElement>('[data-to]');
    const toggle = get<HTMLButtonElement>('[data-reserve]');
    const local = get<HTMLDivElement>('[data-local]');
    const status = get<HTMLParagraphElement>('[role=status]');
    const submit = get<HTMLButtonElement>('[type=submit]');
    const routes = get<HTMLUListElement>('[data-routes]');
    const form = get<HTMLFormElement>('form');
    const stop = new AbortController();
    const portLabel = (uid: number): string => {
      const port = city.get(uid);
      return port
        ? `${townName(towns.townOfBuilding(port))} · ${buildingName(port.def.id)} (${port.x}, ${port.z})`
        : '—';
    };
    function choices(
      select: HTMLSelectElement,
      options: readonly (readonly [string, string])[],
    ): void {
      const signature = JSON.stringify(options);
      if (select.dataset.options === signature) return;
      const value = select.value;
      select.replaceChildren(...options.map(([id, name]) => new Option(name, id)));
      select.dataset.options = signature;
      if (options.some(([id]) => id === value)) select.value = value;
    }
    const resourceOptions = TRADE_RESOURCES.map((r) => [r, t(`resource.${r}`)] as const);
    choices(resource, resourceOptions);
    choices(cargo, resourceOptions);
    choices(
      role,
      TOWN_ROLES.map((r) => [r, t(`trade.role.${r}`)] as const),
    );
    choices(
      policy,
      LOCAL_POLICIES.map(
        (p) => [p, p === 'none' ? t('trade.policyNone') : t(`policy.${p}.name`)] as const,
      ),
    );
    function updateOptions(): void {
      choices(
        town,
        towns.all().map((tw) => [String(tw.id), townName(tw.id)] as const),
      );
      const ports = trade.ports().filter((b) => trade.reserve(towns.townOfBuilding(b)));
      choices(
        source,
        ports.map((p) => [String(p.uid), portLabel(p.uid)] as const),
      );
      const from = city.get(Number(source.value));
      const targetPorts = from
        ? ports.filter((p) => towns.townOfBuilding(p) !== towns.townOfBuilding(from))
        : [];
      choices(
        target,
        targetPorts.map((p) => [String(p.uid), portLabel(p.uid)] as const),
      );
      submit.disabled = !source.value || !target.value;
      updateReadouts();
    }
    function updateReadouts(): void {
      const id = Number(town.value);
      const reserve = trade.reserve(id);
      local.hidden = !town.value;
      role.value = trade.role(id);
      get('[data-effects]').textContent = t(`trade.effect.${role.value}`);
      policy.value = trade.policy(id);
      get('[data-policy-effects]').textContent =
        policy.value === 'none'
          ? ''
          : t(`policy.${policy.value}.effect`) +
            (trade.isPolicyActive(id, policy.value) ? '' : ` · ${t('trade.policyPaused')}`);
      toggle.textContent = t(reserve ? 'trade.closeReserve' : 'trade.openReserve');
      get('[data-stock]').hidden = !reserve;
      const r = resource.value;
      get('[data-quantity-info]').textContent = t('trade.quantityInfo', {
        local: fmt(reserve?.[r] ?? 0),
        capacity: trade.capacity(r),
        shared: fmt(city.stock[r] ?? 0),
      });
      const live = trade.shipments();
      for (const node of Array.from(routes.children)) {
        if (!live.some((route) => String(route.id) === (node as HTMLElement).dataset.route))
          node.remove();
      }
      for (const route of live) {
        let row = routes.querySelector<HTMLLIElement>(`[data-route="${route.id}"]`);
        if (!row) {
          row = document.createElement('li');
          row.dataset.route = String(route.id);
          const description = document.createElement('span');
          const cancel = document.createElement('button');
          cancel.type = 'button';
          cancel.textContent = t('trade.cancel');
          cancel.addEventListener('click', () => trade.cancel(route.id), { signal: stop.signal });
          row.append(description, cancel);
          routes.appendChild(row);
        }
        const state = route.remaining
          ? t('trade.sailing', { seconds: Math.ceil(route.remaining / TICK_HZ) })
          : t(route.cargo ? 'trade.waitUnload' : 'trade.waitLoad');
        row.firstElementChild!.textContent = t('trade.shipment', {
          from: portLabel(route.from),
          to: portLabel(route.to),
          resource: t(`resource.${route.resource}`),
          amount: route.amount,
          keep: route.keep,
          delivered: route.delivered,
          state,
        });
      }
    }
    get('[data-close]').addEventListener('click', () => dialog.close());
    town.addEventListener('change', updateReadouts);
    resource.addEventListener('change', updateReadouts);
    source.addEventListener('change', updateOptions);
    role.addEventListener('change', () =>
      trade.setRole(Number(town.value), role.value as TownRole),
    );
    policy.addEventListener('change', () =>
      trade.setPolicy(Number(town.value), policy.value as LocalPolicy),
    );
    toggle.addEventListener('click', () => {
      const id = Number(town.value);
      if (trade.reserve(id)) trade.close(id);
      else trade.open(id);
    });
    function transfer(sign: number): void {
      const amount = trade.transfer(
        Number(town.value),
        resource.value as TradeResource,
        sign * Math.max(0, get<HTMLInputElement>('[data-quantity]').valueAsNumber),
      );
      status.textContent = amount
        ? t('trade.moved', { amount: fmt(Math.abs(amount)) })
        : t('trade.noneMoved');
    }
    get('[data-deposit]').addEventListener('click', () => transfer(1));
    get('[data-withdraw]').addEventListener('click', () => transfer(-1));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const result = trade.add({
        from: Number(source.value),
        to: Number(target.value),
        resource: cargo.value as TradeResource,
        amount: Number(data.get('amount')),
        keep: Number(data.get('keep')),
      });
      status.textContent = t(`trade.result.${result}`);
    });
    dialog.addEventListener('pointerdown', (event) => event.stopPropagation());
    dialog.addEventListener('keydown', (event) => event.stopPropagation());
    trade.listeners.add(updateOptions);
    const unsubscribe = city.on((event) => {
      if (event.type === 'stock') updateReadouts();
      else if (event.type === 'added' || event.type === 'removed' || event.type === 'status')
        updateOptions();
    });
    dialog.addEventListener(
      'close',
      () => {
        stop.abort();
        trade.listeners.delete(updateOptions);
        unsubscribe();
        dialog.remove();
        button.focus();
      },
      { once: true },
    );
    document.body.appendChild(dialog);
    updateOptions();
    dialog.showModal();
  });
}

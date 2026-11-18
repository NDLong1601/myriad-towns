import type { City, PlacedBuilding } from '@/sim/city';
import { TICK_HZ } from '@/sim/clock';
import type { Problem, Simulation } from '@/sim/simulation';
import { describeCheck } from '@/ui/describe';
import { buildingName, t } from '@/ui/i18n';
import { hudIcon } from '@/ui/icons';
import '@/ui/panels/progressAlerts.css';

interface Alert {
  building: PlacedBuilding;
  problem: Problem;
  count: number;
}

function alertKey(problem: Problem): string {
  switch (problem.kind) {
    case 'labor':
      return `labor:${problem.tier}`;
    case 'hungry':
    case 'input':
      return `input:${problem.resource}`;
    case 'requirement': {
      const { key, params } = problem.check;
      return `${key}:${params.field ?? params.building ?? params.terrain ?? ''}`;
    }
  }
}

function reasonOf(problem: Problem): string {
  switch (problem.kind) {
    case 'labor':
      return t('alert.labor', { resource: t(`resource.${problem.tier}`) });
    case 'hungry':
    case 'input':
      return t('alert.input', { resource: t(`resource.${problem.resource}`) });
    case 'requirement': {
      const { key, params } = problem.check;
      if (key === 'req.fieldMin' || key === 'req.fieldMax')
        return t(key === 'req.fieldMin' ? 'alert.fieldLow' : 'alert.fieldHigh', {
          field: t(`field.${params.field}`),
        });
      return describeCheck(problem.check);
    }
  }
}

function adviceOf(problem: Problem, hungry: boolean): string {
  if (isHungryForFood(problem)) return t('alert.hungryAdvice');
  if (problem.kind === 'labor') return t(hungry ? 'alert.hungryAdvice' : 'alert.laborAdvice');
  if (problem.kind === 'input' || problem.kind === 'hungry') return t('alert.inputAdvice');
  return t('alert.requirementAdvice');
}

function isHungryForFood(problem: Problem): boolean {
  return problem.kind === 'hungry' && problem.resource === 'food';
}

/** A persistent rollup of current issues, without repeating a toast each game second. */
export function mountProgressAlerts(
  city: City,
  sim: Simulation,
  parent: HTMLElement,
  focus: (x: number, z: number, uid: number) => void,
): void {
  const panel = document.createElement('details');
  panel.className = 'mt-progress-alerts';
  panel.hidden = true;
  const summary = document.createElement('summary');
  const list = document.createElement('ul');
  panel.append(summary, list);
  parent.appendChild(panel);
  panel.addEventListener('pointerdown', (event) => event.stopPropagation());

  const rows = new Map<
    string,
    { item: HTMLLIElement; title: HTMLElement; action: HTMLElement; advice: HTMLElement }
  >();
  let alerts = new Map<string, Alert>();
  let lastTick = -TICK_HZ;
  let previous = new Set<string>();

  function collect(): Map<string, Alert> {
    const result = new Map<string, Alert>();
    const dormant = new Set(sim.dormantTowns());
    for (const b of city.all()) {
      if (!city.isActive(b.uid)) continue;
      if (dormant.size && sim.tiers && dormant.has(sim.tiers.townOfBuilding(b))) continue;
      const state = sim.stateOf(b.uid);
      if (!state) continue;
      // A warning means the shortage or unmet service has held long enough to threaten decline.
      const problems = state.warnedAt >= 0 ? sim.problemsOf(b.uid) : state.shortages;
      for (const problem of problems) {
        const key = alertKey(problem);
        const same = result.get(key);
        if (!same) {
          result.set(key, { building: b, problem, count: 1 });
        } else {
          same.count++;
          if (isHungryForFood(problem) && !isHungryForFood(same.problem)) {
            same.problem = problem;
            same.building = b;
          }
        }
      }
    }
    return result;
  }

  function render(): void {
    for (const [key, row] of rows) {
      if (alerts.has(key)) continue;
      row.item.remove();
      rows.delete(key);
    }
    const hungry = [...alerts.values()].some(({ problem }) => isHungryForFood(problem));
    const title = t('alert.title', { n: alerts.size });
    if (summary.textContent !== title) summary.textContent = title;
    panel.hidden = !alerts.size;
    if (!alerts.size) panel.open = false;

    for (const [key, alert] of alerts) {
      let row = rows.get(key);
      if (!row) {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        const title = document.createElement('strong');
        const action = document.createElement('span');
        const link = document.createElement('span');
        link.className = 'mt-alert-action';
        link.innerHTML = hudIcon('go', 14);
        link.append(action);
        button.append(title, link);
        button.addEventListener('click', () => {
          const current = alerts.get(key);
          const b = current && city.get(current.building.uid);
          if (b) focus(b.x + b.def.footprint.w / 2, b.z + b.def.footprint.d / 2, b.uid);
        });
        const details = document.createElement('details');
        const toggle = document.createElement('summary');
        toggle.title = t('alert.advice');
        toggle.setAttribute('aria-label', toggle.title);
        toggle.innerHTML = hudIcon('info', 17);
        const advice = document.createElement('p');
        details.append(toggle, advice);
        item.append(button, details);
        list.append(item);
        row = { item, title, action, advice };
        rows.set(key, row);
      }
      const title = t('alert.affected', { n: alert.count, reason: reasonOf(alert.problem) });
      const action = t('alert.view', { building: buildingName(alert.building.def.id) });
      const advice = adviceOf(alert.problem, hungry);
      if (row.title.textContent !== title) row.title.textContent = title;
      if (row.action.textContent !== action) row.action.textContent = action;
      if (row.advice.textContent !== advice) row.advice.textContent = advice;
    }
  }

  city.on((event) => {
    if (event.type !== 'stock' || sim.tick - lastTick < TICK_HZ) return;
    lastTick = sim.tick;
    const observed = collect();
    // Ignore conditions that clear before the next game-second sample.
    alerts = new Map([...observed].filter(([key]) => previous.has(key)));
    previous = new Set(observed.keys());
    render();
  });
}

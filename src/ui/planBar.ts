import type { Amounts } from '@/sim/catalog';
import type { History } from '@/sim/commands';
import type { Blueprint, BlueprintRotation, PlanStore } from '@/sim/plan';
import { formatAmounts, t } from '@/ui/i18n';
import '@/ui/panels/blueprints.css';

interface SavedBlueprint {
  name: string;
  pieces: Blueprint;
}

const STORAGE_KEY = 'mt.blueprints.v1';
const NAME_LENGTH = 48;
const LIBRARY_LIMIT = 20;
const ROTATIONS: readonly BlueprintRotation[] = [0, 90, 180, 270];

function readLibrary(plans: PlanStore): SavedBlueprint[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(saved)) return [];
    const library: SavedBlueprint[] = [];
    for (const entry of saved.slice(0, LIBRARY_LIMIT) as unknown[]) {
      if (!entry || typeof entry !== 'object') continue;
      const { name, pieces } = entry as { name?: unknown; pieces?: unknown };
      if (typeof name !== 'string' || !name.trim()) continue;
      const blueprint = plans.readBlueprint(pieces);
      if (blueprint) library.push({ name: name.trim().slice(0, NAME_LENGTH), pieces: blueprint });
    }
    return library;
  } catch {
    return [];
  }
}

function operationLine(label: string, amounts: Amounts, rate = false): HTMLDivElement | undefined {
  const formatted = formatAmounts(amounts);
  if (!formatted) return undefined;
  const row = document.createElement('div');
  const title = document.createElement('dt');
  title.textContent = label;
  const value = document.createElement('dd');
  value.textContent = rate ? t('plan.stockRate', { amounts: formatted }) : formatted;
  row.append(title, value);
  return row;
}

/** Plan mode toggle, costs and operations forecast, and reusable spatial drafts. */
export function mountPlanBar(
  plans: PlanStore,
  history: History,
  parent: HTMLElement,
  toolbar: HTMLElement,
  viewCentre?: () => { x: number; z: number },
): void {
  const el = document.createElement('div');
  el.className = 'mt-planbar';
  el.id = 'mt-plan-details';
  el.innerHTML = `
    <span data-plan="total"></span>
    <button type="button" data-act="build">${t('ui.planBuild')}</button>
    <button type="button" data-act="clear">${t('ui.planClear')}</button>
    <details data-plan="operations">
      <summary>${t('plan.operations')}</summary>
      <dl></dl>
    </details>
  `;
  parent.appendChild(el);
  el.addEventListener('pointerdown', (e) => e.stopPropagation());

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'mt-plan-btn';
  toggle.title = t('ui.plan');
  toggle.setAttribute('aria-label', t('ui.plan'));
  toggle.setAttribute('aria-controls', el.id);
  toggle.innerHTML =
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V3l18 18H3Z"/><path d="M7 17v-4l4 4H7ZM8 9h2m-2 4h2m-2 4h2"/></svg>';
  toolbar.appendChild(toggle);
  toggle.addEventListener('pointerdown', (e) => e.stopPropagation());
  toggle.addEventListener('click', () => plans.setMode(!plans.mode));

  const total = el.querySelector<HTMLElement>('[data-plan=total]')!;
  const build = el.querySelector<HTMLButtonElement>('[data-act=build]')!;
  const clear = el.querySelector<HTMLButtonElement>('[data-act=clear]')!;
  const operations = el.querySelector<HTMLDetailsElement>('[data-plan=operations]')!;
  const list = operations.querySelector('dl')!;
  build.addEventListener('click', () => {
    plans.build(history);
    if (!plans.count) toggle.focus();
  });
  clear.addEventListener('click', () => {
    plans.clear();
    toggle.focus();
  });
  const libraryRender = viewCentre ? mountLibrary(el, plans, viewCentre) : undefined;

  const render = (): void => {
    const n = plans.count;
    el.classList.toggle('on', plans.mode);
    el.hidden = !n && !plans.mode;
    toggle.setAttribute('aria-pressed', String(plans.mode));
    total.textContent = n
      ? [t('ui.planCount', { n }), formatAmounts(plans.totalCost())].filter(Boolean).join(' · ')
      : t('ui.planHint');
    build.hidden = clear.hidden = n === 0;
    const { consumed, produced, workersNeeded, workersProvided } = plans.operations();
    const rows = [
      operationLine(t('ui.upkeep'), consumed, true),
      operationLine(t('ui.produces'), produced, true),
      operationLine(t('plan.workersNeeded'), workersNeeded),
      operationLine(t('plan.workersProvided'), workersProvided),
    ].filter((row) => row !== undefined);
    operations.hidden = rows.length === 0;
    list.replaceChildren(...rows);
    libraryRender?.();
  };
  plans.on(render);
  render();
}

function mountLibrary(
  parent: HTMLElement,
  plans: PlanStore,
  viewCentre: () => { x: number; z: number },
): () => void {
  let library = readLibrary(plans);
  const el = document.createElement('details');
  el.className = 'mt-blueprint-library';
  el.innerHTML = `
    <summary>${t('plan.library')}</summary>
    <form class="mt-blueprint-fields">
      <label>${t('plan.name')}<input type="text" maxlength="${NAME_LENGTH}"></label>
      <button type="submit">${t('plan.save')}</button>
    </form>
    <div class="mt-blueprint-fields">
      <label>${t('plan.choose')}<select data-blueprint="select"></select></label>
      <label>${t('plan.rotation')}<select data-blueprint="rotation"></select></label>
      <small data-blueprint="rotationHint" hidden>${t('plan.rectangular')}</small>
      <p role="status"></p>
      <button type="button" data-blueprint="place">${t('plan.paste')}</button>
      <button type="button" data-blueprint="delete">${t('plan.delete')}</button>
    </div>
  `;
  parent.appendChild(el);
  const form = el.querySelector('form')!;
  const name = form.querySelector('input')!;
  const choices = el.querySelector<HTMLSelectElement>('[data-blueprint=select]')!;
  const rotation = el.querySelector<HTMLSelectElement>('[data-blueprint=rotation]')!;
  const rotationHint = el.querySelector<HTMLElement>('[data-blueprint=rotationHint]')!;
  const place = el.querySelector<HTMLButtonElement>('[data-blueprint=place]')!;
  const remove = el.querySelector<HTMLButtonElement>('[data-blueprint=delete]')!;
  const status = el.querySelector('p')!;
  for (const angle of ROTATIONS) rotation.add(new Option(`${angle}°`, String(angle)));

  function message(key: string, params?: Record<string, number>): void {
    status.textContent = t(key, params);
  }

  function updateRotation(): void {
    const selected = library[choices.selectedIndex];
    const supportsQuarterTurns = !!selected && plans.blueprintSize(selected.pieces).quarterTurns;
    rotationHint.hidden = !selected || supportsQuarterTurns;
    for (const option of rotation.options) {
      const angle = Number(option.value);
      option.disabled = !supportsQuarterTurns && (angle === 90 || angle === 270);
    }
    if (rotation.selectedOptions[0]?.disabled) rotation.value = '0';
    rotation.disabled = place.disabled = remove.disabled = !selected;
  }

  function updateChoices(index: number): void {
    choices.replaceChildren(...library.map((bp, i) => new Option(bp.name, String(i))));
    choices.disabled = library.length === 0;
    choices.selectedIndex = index;
    updateRotation();
  }

  function save(next: SavedBlueprint[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      library = next;
      return true;
    } catch {
      message('plan.storageError');
      return false;
    }
  }

  el.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)
      e.stopPropagation();
  });
  choices.addEventListener('change', updateRotation);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!plans.count) return;
    if (library.length >= LIBRARY_LIMIT) return message('plan.libraryLimit');
    const pieces = plans.captureBlueprint();
    if (!pieces) return message('plan.saveLimit');
    const title = name.value.trim() || t('plan.defaultName', { n: library.length + 1 });
    if (save([...library, { name: title, pieces }])) {
      name.value = '';
      updateChoices(library.length - 1);
      message('plan.saved');
    }
  });
  remove.addEventListener('click', () => {
    const index = choices.selectedIndex;
    if (index < 0) return;
    if (save(library.filter((_, i) => i !== index))) {
      updateChoices(Math.min(index, library.length - 1));
      if (choices.disabled) el.querySelector('summary')?.focus();
      else choices.focus();
      message('plan.deleted');
    }
  });
  place.addEventListener('click', () => {
    const selected = library[choices.selectedIndex];
    const angle = ROTATIONS.find((v) => String(v) === rotation.value);
    if (!selected || angle === undefined) return;
    const { w, d } = plans.blueprintSize(selected.pieces);
    const quarterTurn = angle === 90 || angle === 270;
    const centre = viewCentre();
    const x = Math.floor(centre.x - (quarterTurn ? d : w) / 2 + 0.5);
    const z = Math.floor(centre.z - (quarterTurn ? w : d) / 2 + 0.5);
    const n = plans.stampBlueprint(selected.pieces, x, z, angle);
    if (n) message('plan.placed', { n });
    else message('plan.blocked');
  });
  updateChoices(library.length ? 0 : -1);
  return () => {
    form.hidden = plans.count === 0;
  };
}

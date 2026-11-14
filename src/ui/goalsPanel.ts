import type { City } from '@/sim/city';
import type { Goal, Goals } from '@/sim/goals';
import { PACKS } from '@/sim/progress';
import type { Simulation } from '@/sim/simulation';
import { buildingName, fmt, formatAmounts, t } from './i18n';
import type { SandboxOptions } from './newGame';

function goalText(g: Goal, have: number): string {
  const p: Record<string, string | number> = { min: g.min, have: fmt(have) };
  if ('building' in g) p.building = buildingName(g.building);
  if ('resource' in g) p.resource = t(`resource.${g.resource}`);
  return t(`goal.${g.type}`, p);
}

const CHAPTER_PRODUCER: Readonly<Record<string, string>> = {
  goods: 'craft_studio',
  knowledge: 'public_library',
};

/** Goals mode: the current chapter's checklist, and the pack choice when a chapter ends. */
export function mountGoalsPanel(goals: Goals, parent: HTMLElement): void {
  const el = document.createElement('section');
  el.className = 'mt-goals';
  el.setAttribute('aria-label', t('ui.goals'));
  parent.appendChild(el);
  el.addEventListener('pointerdown', (e) => e.stopPropagation());

  const render = (): void => {
    const ch = goals.current;
    if (!ch) {
      el.innerHTML = `<h3>${t('ui.goals')}</h3><p>${t('chapter.done')}</p>`;
      return;
    }
    const rows = goals
      .status()
      .map((s) => {
        const producer =
          s.goal.type === 'production' ? CHAPTER_PRODUCER[s.goal.resource] : undefined;
        const hint =
          !s.done && producer
            ? `<small>${t('ui.goalProducer', { building: buildingName(producer) })}</small>`
            : '';
        return `<li class="${s.done ? 'ok' : ''}">${s.done ? '✓' : '○'} ${goalText(s.goal, s.have)}${hint}</li>`;
      })
      .join('');
    const reward = ch.reward
      ? `<small>${t('ui.reward', { what: formatAmounts(ch.reward) })}</small>`
      : '';
    el.innerHTML = `<h3>${t(`chapter.${ch.id}`)}</h3><ul>${rows}</ul>${reward}`;
  };

  // Pack choice dialog.
  const dialog = document.createElement('div');
  dialog.className = 'mt-choice';
  dialog.hidden = true;
  // On the body, not in the left column: that column's stacking context would put toasts above it.
  document.body.appendChild(dialog);
  dialog.addEventListener('pointerdown', (e) => e.stopPropagation());
  dialog.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-pack]');
    if (b?.dataset.pack && goals.choose(b.dataset.pack)) dialog.hidden = true;
  });
  const showChoice = (packs: readonly string[]): void => {
    dialog.innerHTML = `<div class="mt-choice-card" role="dialog" aria-modal="true"><h2>${t('ui.choosePack')}</h2><div class="mt-choice-row">${packs
      .map((id) => {
        const p = PACKS.find((x) => x.id === id);
        const list = (p?.buildings ?? []).map((b) => `<li>${buildingName(b)}</li>`).join('');
        return `<button type="button" data-pack="${id}"><b>${t(`pack.${id}`)}</b><ul>${list}</ul></button>`;
      })
      .join('')}</div><small>${t('ui.choosePackHint')}</small></div>`;
    dialog.hidden = false;
  };

  goals.on((e) => {
    if (e.type === 'choice') showChoice(e.packs);
    render();
  });
  setInterval(render, 1000);
  render();
  if (goals.pending) showChoice(goals.pending);
}

/** Sandbox mode: live toggles for the rule options. */
export function mountSandboxPanel(
  opts: SandboxOptions,
  city: City,
  sim: Simulation,
  parent: HTMLElement,
): void {
  const el = document.createElement('section');
  el.className = 'mt-goals';
  parent.appendChild(el);
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.innerHTML = `<h3>${t('mode.sandbox')}</h3>
    <label><input type="checkbox" data-opt="unlockAll" ${opts.unlockAll ? 'checked' : ''}> ${t('sandbox.unlockAll')}</label>
    <label><input type="checkbox" data-opt="freeBuild" ${opts.freeBuild ? 'checked' : ''}> ${t('sandbox.freeBuild')}</label>
    <label><input type="checkbox" data-opt="noDecline" ${opts.noDecline ? 'checked' : ''}> ${t('sandbox.noDecline')}</label>`;
  el.addEventListener('change', (e) => {
    const box = e.target as HTMLInputElement;
    const k = box.dataset.opt as keyof SandboxOptions | undefined;
    if (!k) return;
    opts[k] = box.checked;
    applySandbox(opts, city, sim);
  });
}

export function applySandbox(opts: SandboxOptions, city: City, sim: Simulation): void {
  city.progress.sandbox = opts.unlockAll;
  city.freeBuild = opts.freeBuild;
  sim.noDecline = opts.noDecline;
  city._addStock({}, 1); // refresh menus (affordability, locks)
}

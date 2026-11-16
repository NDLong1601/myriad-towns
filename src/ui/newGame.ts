import { t } from './i18n';
import { STARTING_AREAS, SUPPLY_LEVELS } from './gameStart';
import { loadSettings, saveSettings } from './settingsStore';

export type GameMode = 'goals' | 'sandbox';

export interface SandboxOptions {
  unlockAll: boolean;
  freeBuild: boolean;
  noDecline: boolean;
}

export interface GameSetup {
  mode: GameMode;
  sandbox: SandboxOptions;
  /** True when the URL did not choose a game yet (show the new-game dialog). */
  undecided: boolean;
  /** Show the step-by-step tutorial (?tut=1, set by the new-game dialog). */
  tutorial: boolean;
}

const TUTORIAL_DONE = 'mt.tutorialDone';

/** Whether this browser already finished or skipped the tutorial. */
export function tutorialDone(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_DONE) === '1';
  } catch {
    return false;
  }
}

export function markTutorialDone(): void {
  try {
    localStorage.setItem(TUTORIAL_DONE, '1');
  } catch {
    // Private mode: the tutorial simply shows again next time it is asked for.
  }
}

/**
 * Reads mode and options from the URL: ?mode=goals|sandbox, ?unlock=1&free=1&nodecline=1.
 * ?sandbox=1 (older links and tests) = Sandbox with everything on.
 */
export function readSetup(params: URLSearchParams): GameSetup {
  const flag = (k: string, d: boolean): boolean => (params.has(k) ? params.get(k) === '1' : d);
  if (params.get('sandbox') === '1') {
    return {
      mode: 'sandbox',
      sandbox: { unlockAll: true, freeBuild: false, noDecline: false },
      undecided: false,
      tutorial: false,
    };
  }
  const mode: GameMode = params.get('mode') === 'sandbox' ? 'sandbox' : 'goals';
  const sb = mode === 'sandbox';
  return {
    mode,
    sandbox: {
      unlockAll: flag('unlock', sb),
      freeBuild: flag('free', false),
      noDecline: flag('nodecline', false),
    },
    undecided: !params.has('mode') && !params.has('seed'),
    tutorial: params.get('tut') === '1',
  };
}

/** The new-game dialog. Starting reloads the page with the chosen seed and mode in the URL. */
export function showNewGame(
  parent: HTMLElement,
  current: { seed: string; close?: () => void },
): void {
  const settings = loadSettings();
  const previous = document.activeElement;
  const el = document.createElement('div');
  el.className = 'mt-newgame';
  const choices = (name: string, values: readonly string[], selected: string): string =>
    values
      .map(
        (value) =>
          `<label><input type="radio" name="${name}" value="${value}" ${value === selected ? 'checked' : ''}><span>${t(`launch.${value}`)}</span></label>`,
      )
      .join('');
  el.innerHTML = `<form class="mt-newgame-card mt-world-config" ${current.close ? '' : 'role="dialog" aria-modal="true"'} aria-labelledby="mt-ng-title">
    <header class="mt-config-heading"><h2 id="mt-ng-title" tabindex="-1">${t('ui.newGame')}</h2></header>
    <div class="mt-config-fields">
      <label>${t('launch.cityName')}<input name="city" maxlength="40" placeholder="${t('launch.cityPlaceholder')}"></label>
      <label>${t('ui.seed')}<span class="mt-seed"><input name="seed" maxlength="40"><button type="button" data-act="random" title="${t('ui.random')}">↻ <span>${t('ui.random')}</span></button></span></label>
    </div>
    <fieldset class="mt-modes">
      <legend>${t('launch.mode')}</legend>
      <label><input type="radio" name="mode" value="goals" checked><b>${t('mode.goals')}</b><small>${t('mode.goalsHint')}</small></label>
      <label><input type="radio" name="mode" value="sandbox"><b>${t('mode.sandbox')}</b><small>${t('mode.sandboxHint')}</small></label>
    </fieldset>
    <fieldset class="mt-config-options">
      <legend>${t('launch.startingArea')}</legend>
      <div class="mt-config-choices">${choices('area', STARTING_AREAS, 'anywhere')}</div>
      <small data-area-hint></small>
    </fieldset>
    <fieldset class="mt-config-options">
      <legend>${t('launch.supplies')}</legend>
      <div class="mt-config-choices">${choices('supplies', SUPPLY_LEVELS, 'standard')}</div>
      <small data-supply-hint></small>
    </fieldset>
    <label class="mt-config-terrain">${t('launch.terrain')} <select name="surface">
      <option value="flat" ${settings.flatTerrain ? 'selected' : ''}>${t('launch.flat')}</option>
      <option value="hills" ${settings.flatTerrain ? '' : 'selected'}>${t('launch.hills')}</option>
    </select></label>
    <label class="mt-tut"><input type="checkbox" name="tut" ${tutorialDone() ? '' : 'checked'}> ${t('ui.tutorial')}</label>
    <fieldset class="mt-sb" disabled hidden>
      <label><input type="checkbox" name="unlock" checked> ${t('sandbox.unlockAll')}</label>
      <label><input type="checkbox" name="free"> ${t('sandbox.freeBuild')}</label>
      <label><input type="checkbox" name="nodecline"> ${t('sandbox.noDecline')}</label>
    </fieldset>
    <div class="mt-config-actions"><button type="button" data-act="close">${t('launch.back')}</button>
      <button type="submit" class="mt-primary">${t('ui.start')} <span aria-hidden="true">→</span></button></div>
  </form>`;
  parent.appendChild(el);
  const form = el.querySelector('form') as HTMLFormElement;
  const sb = el.querySelector('.mt-sb') as HTMLFieldSetElement;
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  const close = (): void => {
    el.remove();
    if (current.close) current.close();
    else if (previous instanceof HTMLElement) previous.focus();
  };
  el.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') close();
  });
  form.querySelector('[data-act=close]')?.addEventListener('click', close);
  const update = (): void => {
    const state = new FormData(form);
    sb.disabled = state.get('mode') !== 'sandbox';
    sb.hidden = sb.disabled;
    form.querySelector('[data-area-hint]')!.textContent = t(
      `launch.${String(state.get('area'))}Hint`,
    );
    form.querySelector('[data-supply-hint]')!.textContent = t(
      `launch.${String(state.get('supplies'))}Hint`,
    );
  };
  form.addEventListener('change', update);
  update();
  (form.elements.namedItem('seed') as HTMLInputElement).value = current.seed;
  form.querySelector('[data-act=random]')?.addEventListener('click', () => {
    const words = ['song', 'nui', 'dong', 'bien', 'rung', 'gio', 'may', 'sao'];
    const pick = (): string => words[Math.floor(Math.random() * words.length)] as string;
    (form.elements.namedItem('seed') as HTMLInputElement).value =
      `${pick()}-${pick()}-${Math.floor(Math.random() * 1000)}`;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const q = new URLSearchParams(window.location.search);
    const mode = String(fd.get('mode'));
    q.set('seed', String(fd.get('seed') || 'myriad'));
    q.set('mode', mode);
    for (const k of [
      'unlock',
      'free',
      'nodecline',
      'sandbox',
      'tut',
      'load',
      'x',
      'z',
      'time',
      'terrain',
    ])
      q.delete(k);
    const city = String(fd.get('city') ?? '').trim();
    if (city) q.set('city', city);
    else q.delete('city');
    q.set('area', String(fd.get('area')));
    q.set('supplies', String(fd.get('supplies')));
    q.set('tray', '0');
    const flatTerrain = fd.get('surface') !== 'hills';
    saveSettings({ ...loadSettings(), flatTerrain });
    q.set('terrain', flatTerrain ? 'flat' : 'hills');
    if (fd.get('tut')) q.set('tut', '1');
    if (mode === 'sandbox') {
      for (const k of ['unlock', 'free', 'nodecline']) q.set(k, fd.get(k) ? '1' : '0');
    }
    window.location.search = q.toString();
  });
  form.querySelector<HTMLElement>('h2')?.focus();
}

import { t } from './i18n';

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
  };
}

/** The new-game dialog. Starting reloads the page with the chosen seed and mode in the URL. */
export function showNewGame(parent: HTMLElement, current: { seed: string }): void {
  const el = document.createElement('div');
  el.className = 'mt-newgame';
  el.innerHTML = `<form class="mt-newgame-card" role="dialog" aria-modal="true" aria-labelledby="mt-ng-title">
    <h2 id="mt-ng-title">Myriad Towns · ${t('ui.newGame')}</h2>
    <fieldset class="mt-modes">
      <label><input type="radio" name="mode" value="goals" checked><b>${t('mode.goals')}</b><small>${t('mode.goalsHint')}</small></label>
      <label><input type="radio" name="mode" value="sandbox"><b>${t('mode.sandbox')}</b><small>${t('mode.sandboxHint')}</small></label>
    </fieldset>
    <fieldset class="mt-sb" disabled>
      <label><input type="checkbox" name="unlock" checked> ${t('sandbox.unlockAll')}</label>
      <label><input type="checkbox" name="free"> ${t('sandbox.freeBuild')}</label>
      <label><input type="checkbox" name="nodecline"> ${t('sandbox.noDecline')}</label>
    </fieldset>
    <label class="mt-seed">${t('ui.seed')} <input name="seed" value="${current.seed.replace(/"/g, '')}" maxlength="40"><button type="button" data-act="random">🎲 ${t('ui.random')}</button></label>
    <button type="submit" class="mt-primary">${t('ui.start')}</button>
  </form>`;
  parent.appendChild(el);
  const form = el.querySelector('form') as HTMLFormElement;
  const sb = el.querySelector('.mt-sb') as HTMLFieldSetElement;
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('keydown', (e) => e.stopPropagation());
  form.addEventListener('change', () => {
    sb.disabled = (form.elements.namedItem('mode') as RadioNodeList).value !== 'sandbox';
  });
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
    for (const k of ['unlock', 'free', 'nodecline', 'sandbox']) q.delete(k);
    if (mode === 'sandbox') {
      for (const k of ['unlock', 'free', 'nodecline']) q.set(k, fd.get(k) ? '1' : '0');
    }
    window.location.search = q.toString();
  });
  (form.querySelector('.mt-primary') as HTMLButtonElement).focus();
}

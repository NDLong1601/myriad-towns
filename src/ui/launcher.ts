import { listSlots } from '@/io/store';
import { t } from './i18n';
import { showNewGame } from './newGame';
import { showSaveMenu, urlForSlot } from './saveMenu';
import { showSettings } from './settingsMenu';

export function mountLauncher(parent: HTMLElement): void {
  const screen = document.createElement('main');
  screen.className = 'mt-launch';
  screen.innerHTML = `<div class="mt-launch-layout">
    <div class="mt-launch-start">
      <div class="mt-launch-brand">
        <svg viewBox="0 0 80 64" width="62" height="50" aria-hidden="true"><path fill="currentColor" d="M40 0 80 23v18L40 64 0 41V23zm0 9L8 27v10l32 18 32-18V27z"/><path fill="currentColor" d="M23 23v12l9 5V28zm14-10v30l9 5V18zm14 10v25l9-5V28z"/></svg>
        <h1 aria-label="Myriad Towns">MYRIAD<br><span>TOWNS</span></h1>
      </div>
      <nav class="mt-launch-nav" aria-label="${t('launch.mainMenu')}">
        <button type="button" data-view="new" aria-controls="mt-launch-pane" aria-expanded="false"><span>${t('ui.newGame')}</span><span aria-hidden="true">+</span></button>
        <a class="mt-continue" aria-disabled="true"><span>${t('launch.continue')}</span><small data-last-save></small></a>
        <button type="button" data-view="load" aria-controls="mt-launch-pane" aria-expanded="false"><span>${t('launch.load')}</span><span aria-hidden="true">↳</span></button>
        <button type="button" data-view="settings" aria-controls="mt-launch-pane" aria-expanded="false"><span>${t('settings.title')}</span><span aria-hidden="true">⋯</span></button>
        <button type="button" data-view="credits" aria-controls="mt-launch-pane" aria-expanded="false"><span>${t('launch.credits')}</span><span aria-hidden="true">↗</span></button>
      </nav>
    </div>
    <section id="mt-launch-pane" class="mt-launch-pane" hidden></section>
  </div>`;
  parent.appendChild(screen);
  const nav = screen.querySelector<HTMLElement>('nav')!;
  const pane = screen.querySelector<HTMLElement>('section')!;
  const resume = nav.querySelector<HTMLAnchorElement>('.mt-continue')!;
  const savedName = resume.querySelector<HTMLElement>('[data-last-save]')!;
  const refreshLatest = (): void => {
    void listSlots()
      .then(([latest]) => {
        if (latest) resume.href = urlForSlot(latest.id);
        else resume.removeAttribute('href');
        savedName.textContent = latest?.name ?? '';
        resume.setAttribute('aria-disabled', String(!latest));
      })
      .catch(() => undefined);
  };
  refreshLatest();
  window.addEventListener('pageshow', refreshLatest);
  const buttons = nav.querySelectorAll<HTMLButtonElement>('[data-view]');
  const close = (trigger: HTMLButtonElement): void => {
    pane.replaceChildren();
    pane.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
    refreshLatest();
  };
  nav.addEventListener('click', (e) => {
    const trigger = (e.target as Element).closest<HTMLButtonElement>('button[data-view]');
    if (!trigger) return;
    pane.replaceChildren();
    pane.hidden = false;
    for (const button of buttons) button.setAttribute('aria-expanded', String(trigger === button));
    const back = (): void => close(trigger);
    switch (trigger.dataset.view) {
      case 'new':
        showNewGame(pane, { seed: 'myriad', close: back });
        break;
      case 'load':
        showSaveMenu(pane, undefined, back);
        break;
      case 'settings':
        showSettings(
          pane,
          () => {
            const url = new URL(window.location.href);
            for (const param of ['lang', 'r', 'quality', 'terrain', 'daynight', 'traffic'])
              url.searchParams.delete(param);
            window.location.replace(url);
          },
          undefined,
          back,
        );
        break;
      case 'credits':
        pane.innerHTML = `<div class="mt-launch-credits"><h2 tabindex="-1">${t('launch.credits')}</h2>
          <p>Myriad Towns · ${t('launch.creditsTeam')}</p><p>${t('launch.creditsArt')}</p>
          <button type="button">${t('launch.back')}</button></div>`;
        pane.querySelector('button')?.addEventListener('click', back);
        pane.querySelector('h2')?.focus();
        pane.firstElementChild?.addEventListener('keydown', (event) => {
          if ((event as KeyboardEvent).key === 'Escape') back();
        });
        break;
    }
  });
}

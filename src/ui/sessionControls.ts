import { t } from './i18n';

export type LightingMode = 'cycle' | 'day' | 'night';

export function mountLighting(
  parent: HTMLElement,
  initial: LightingMode,
  select: (mode: LightingMode) => void,
): (hour: number) => void {
  const el = document.createElement('div');
  el.className = 'mt-lighting';
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', t('launch.lighting'));
  const modes = { cycle: '↻', day: '☀', night: '☾' } as const;
  el.innerHTML = `${Object.entries(modes)
    .map(
      ([mode, glyph]) =>
        `<button type="button" data-light="${mode}" aria-label="${t(`launch.${mode}`)}" title="${t(`launch.${mode}`)}" aria-pressed="${mode === initial}">${glyph}</button>`,
    )
    .join('')}<time></time>`;
  const buttons = el.querySelectorAll<HTMLButtonElement>('button');
  const clock = el.querySelector('time')!;
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLButtonElement>('button');
    if (!button?.dataset.light) return;
    select(button.dataset.light as LightingMode);
    for (const choice of buttons) choice.setAttribute('aria-pressed', String(choice === button));
  });
  parent.appendChild(el);
  return (hour) => {
    const minutes = Math.floor((((hour % 1) + 1) % 1) * 24 * 60);
    const label = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    if (clock.textContent !== label) {
      clock.textContent = label;
      clock.dateTime = label;
    }
  };
}

export function showSessionMenu(newGame: () => void, saveAndExit: () => Promise<boolean>): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'mt-session';
  const previous = document.activeElement;
  dialog.setAttribute('aria-labelledby', 'mt-session-title');
  dialog.innerHTML = `<h2 id="mt-session-title">${t('launch.mainMenu')}</h2>
    <button type="button" data-action="resume" autofocus>${t('launch.resume')}</button>
    <button type="button" data-action="new">${t('ui.newGame')}</button>
    <button type="button" data-action="exit">${t('launch.saveAndExit')}</button><p role="status"></p>`;
  document.body.appendChild(dialog);
  dialog.addEventListener('pointerdown', (e) => e.stopPropagation());
  dialog.addEventListener('keydown', (e) => e.stopPropagation());
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (previous instanceof HTMLElement) previous.focus();
  });
  dialog.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLButtonElement>('button');
    if (!button) return;
    if (button.dataset.action === 'exit') {
      button.disabled = true;
      void saveAndExit()
        .then((saved) => {
          if (!saved) dialog.querySelector('p')!.textContent = t('save.failed');
        })
        .finally(() => {
          button.disabled = false;
        });
    } else {
      dialog.close();
      if (button.dataset.action === 'new') {
        // Wait for the dialog's close event to restore focus before opening the next form.
        dialog.addEventListener('close', newGame, { once: true });
      }
    }
  });
  dialog.showModal();
}

import { t } from './i18n';
import { type Settings, loadSettings, saveSettings } from './settingsStore';

/**
 * Settings dialog. Quality, view radius and language apply on reload, so "Apply" saves the
 * game first (the caller's `apply`) and then reloads.
 */
export function showSettings(
  parent: HTMLElement,
  apply: () => void,
  /** Live preview of the volume slider (applies without a reload). */
  previewVolume?: (v: number) => void,
): void {
  const s = loadSettings();
  const el = document.createElement('div');
  el.className = 'mt-newgame mt-settings';
  const opt = (v: string, label: string, cur: string | undefined): string =>
    `<option value="${v}" ${cur === v ? 'selected' : ''}>${label}</option>`;
  el.innerHTML = `<form class="mt-newgame-card" role="dialog" aria-modal="true" aria-labelledby="mt-st-title">
    <h2 id="mt-st-title">⚙ ${t('settings.title')}</h2>
    <label>${t('settings.quality')}
      <select name="quality">${opt('', t('settings.auto'), s.quality)}${opt('low', t('settings.low'), s.quality)}${opt('medium', t('settings.medium'), s.quality)}${opt('high', t('settings.high'), s.quality)}</select></label>
    <label><span>${t('settings.radius')}: <output>${s.radius ?? t('settings.auto')}</output></span>
      <input type="range" name="radius" min="2" max="10" step="1" value="${s.radius ?? 5}"></label>
    <label>${t('settings.lang')}
      <select name="lang">${opt('vi', 'Tiếng Việt', s.lang ?? 'vi')}${opt('en', 'English', s.lang)}</select></label>
    <label><span>${t('settings.volume')}: <output data-for="volume">${Math.round(s.volume * 100)}%</output></span>
      <input type="range" name="volume" min="0" max="100" step="5" value="${Math.round(s.volume * 100)}"></label>
    <label class="mt-check"><input type="checkbox" name="cvd" ${s.palette === 'cvd' ? 'checked' : ''}> ${t('settings.cvd')}</label>
    <label class="mt-check"><input type="checkbox" name="dayNight" ${s.dayNight ? 'checked' : ''}> ${t('settings.dayNight')}</label>
    <label class="mt-check"><input type="checkbox" name="autosave" ${s.autosave ? 'checked' : ''}> ${t('settings.autosave')}</label>
    <small>${t('settings.reloadHint')}</small>
    <div class="mt-save-row">
      <button type="submit" class="mt-primary">${t('settings.apply')}</button>
      <button type="button" data-act="close">${t('ui.close')}</button>
    </div>
  </form>`;
  parent.appendChild(el);
  const form = el.querySelector('form') as HTMLFormElement;
  const range = form.elements.namedItem('radius') as HTMLInputElement;
  const out = form.querySelector('output') as HTMLOutputElement;
  const vol = form.elements.namedItem('volume') as HTMLInputElement;
  const volOut = form.querySelector('output[data-for=volume]') as HTMLOutputElement;
  vol.addEventListener('input', () => {
    volOut.textContent = `${vol.value}%`;
    previewVolume?.(Number(vol.value) / 100);
  });
  let radiusTouched = s.radius !== undefined;
  range.addEventListener('input', () => {
    radiusTouched = true;
    out.textContent = range.value;
  });
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') close();
  });
  // Closing without applying puts the previewed volume back.
  const close = (): void => {
    previewVolume?.(s.volume);
    el.remove();
  };
  el.querySelector('[data-act=close]')?.addEventListener('click', close);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const q = String(fd.get('quality'));
    const next: Settings = {
      autosave: fd.get('autosave') !== null,
      lang: fd.get('lang') === 'en' ? 'en' : 'vi',
      volume: Number(vol.value) / 100,
      muted: s.muted,
      dayNight: fd.get('dayNight') !== null,
      palette: fd.get('cvd') !== null ? 'cvd' : 'default',
    };
    if (q === 'low' || q === 'medium' || q === 'high') next.quality = q;
    if (radiusTouched) next.radius = Number(range.value);
    saveSettings(next);
    apply();
  });
}

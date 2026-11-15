import type { HeatmapOverlay } from '@/render/heatmap';
import { FIELDS } from '@/sim/catalog';
import { fmt, t } from './i18n';

/** Field picker + legend. Keys 1–9 and 0 toggle the first ten fields. */
export function mountHeatmapControls(
  overlay: HeatmapOverlay,
  parent: HTMLElement,
  opts: { open?: boolean; onToggle?: (open: boolean) => void } = {},
): void {
  const el = document.createElement('div');
  el.className = 'mt-heat';
  el.id = 'mt-heat-controls';
  el.innerHTML = `<label>${t('ui.heatmap')} <select>
      <option value="">${t('ui.heatmapOff')}</option>
      <option value="resources">⛏️ ${t('ui.resources')}</option>
      ${FIELDS.map((f, i) => `<option value="${f}">${(i + 1) % 10}: ${t(`field.${f}`)}</option>`).join('')}
    </select></label><div class="mt-heat-legend" hidden><span class="lo">0</span><i></i><span class="hi"></span></div>`;
  parent.appendChild(el);
  // A corner button shows or hides the panel; hiding also switches the overlay off.
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mt-heat-btn';
  btn.textContent = '🔥';
  btn.title = t('ui.heatmap');
  btn.setAttribute('aria-label', t('ui.heatmap'));
  btn.setAttribute('aria-controls', el.id);
  btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  parent.appendChild(btn);
  let open = opts.open ?? true;
  const setOpen = (v: boolean): void => {
    open = v;
    el.hidden = !open;
    btn.setAttribute('aria-pressed', String(open));
    if (!open) overlay.set(null);
    opts.onToggle?.(open);
  };
  btn.addEventListener('click', () => setOpen(!open));
  el.hidden = !open;
  btn.setAttribute('aria-pressed', String(open));
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  const select = el.querySelector('select') as HTMLSelectElement;
  const legend = el.querySelector('.mt-heat-legend') as HTMLElement;
  const hi = el.querySelector('.hi') as HTMLElement;

  select.addEventListener('change', () => overlay.set(select.value || null));
  overlay.onChange(() => {
    select.value = overlay.current ?? '';
    legend.hidden = overlay.current === null;
    hi.textContent = fmt(overlay.maxValue);
  });
  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (e.ctrlKey || e.metaKey || e.altKey || !open) return;
    const m = /^Digit(\d)$/.exec(e.code);
    if (!m) return;
    const i = (Number(m[1]) + 9) % 10; // 1 → 0 … 0 → 9
    const f = FIELDS[i];
    if (!f) return;
    overlay.set(overlay.current === f ? null : f);
  });
}

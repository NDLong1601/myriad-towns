import type { HeatmapOverlay } from '@/render/heatmap';
import { FIELDS } from '@/sim/catalog';
import { fmt, t } from './i18n';

/** Field picker + legend. Keys 1–9 and 0 toggle the first ten fields. */
export function mountHeatmapControls(overlay: HeatmapOverlay, parent: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'mt-heat';
  el.innerHTML = `<label>${t('ui.heatmap')} <select>
      <option value="">${t('ui.heatmapOff')}</option>
      ${FIELDS.map((f, i) => `<option value="${f}">${(i + 1) % 10}: ${t(`field.${f}`)}</option>`).join('')}
    </select></label><div class="mt-heat-legend" hidden><span class="lo">0</span><i></i><span class="hi"></span></div>`;
  parent.appendChild(el);
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
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const m = /^Digit(\d)$/.exec(e.code);
    if (!m) return;
    const i = (Number(m[1]) + 9) % 10; // 1 → 0 … 0 → 9
    const f = FIELDS[i];
    if (!f) return;
    overlay.set(overlay.current === f ? null : f);
  });
}

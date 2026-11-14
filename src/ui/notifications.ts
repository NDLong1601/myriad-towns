import type { City } from '@/sim/city';
import type { SimEvent, Simulation } from '@/sim/simulation';
import { buildingName, t } from './i18n';

const MAX_TOASTS = 4;
const LIFETIME_MS = 6000;

/**
 * Toasts for what the simulation did: warnings before a decline, declines, upgrades, unlocks.
 * Clicking a toast about a building moves the camera to it.
 */
export function mountNotifications(
  sim: Simulation,
  city: City,
  parent: HTMLElement,
  focus: (x: number, z: number, uid: number) => void,
): void {
  const el = document.createElement('div');
  el.className = 'mt-toasts';
  el.setAttribute('aria-live', 'polite');
  parent.appendChild(el);
  el.addEventListener('pointerdown', (e) => e.stopPropagation());

  // Many buildings change in the same tick: merge per kind and building type.
  const pending = new Map<string, { e: SimEvent; n: number }>();
  let scheduled = false;

  sim.on((e) => {
    if (e.type === 'resolved' || e.type === 'recovered') return;
    if (e.type === 'unlocked') {
      show(e, 1); // each unlock is its own news
      return;
    }
    const key = `${e.type}:${'defId' in e ? e.defId : 'from' in e ? `${e.from}>${e.to}` : ''}`;
    const p = pending.get(key);
    if (p) p.n++;
    else pending.set(key, { e, n: 1 });
    if (!scheduled) {
      scheduled = true;
      setTimeout(flush, 0);
    }
  });

  function flush(): void {
    scheduled = false;
    for (const { e, n } of pending.values()) show(e, n);
    pending.clear();
  }

  function show(e: SimEvent, n: number): void {
    let text: string;
    let cls: string;
    switch (e.type) {
      case 'warn':
        cls = 'warn';
        text = t('note.warn', { name: buildingName(e.defId), n, s: Math.ceil(e.inTicks / 4) });
        break;
      case 'declined':
        cls = 'bad';
        text = e.to
          ? t('note.declined', { name: buildingName(e.from), to: buildingName(e.to), n })
          : t('note.abandoned', { name: buildingName(e.from), n });
        break;
      case 'upgraded':
        cls = 'good';
        text = t('note.upgraded', { name: buildingName(e.from), to: buildingName(e.to), n });
        break;
      case 'unlocked':
        cls = 'good';
        text = t('note.unlocked', { names: e.ids.map(buildingName).join(', ') });
        break;
      default:
        return;
    }
    if (n > 1) text += ` ×${n}`;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `mt-toast ${cls}`;
    item.textContent = text;
    const uid = 'uid' in e ? e.uid : undefined;
    if (uid !== undefined) {
      item.addEventListener('click', () => {
        const b = city.get(uid);
        if (b) focus(b.x + b.def.footprint.w / 2, b.z + b.def.footprint.d / 2, uid);
      });
    }
    el.prepend(item);
    while (el.children.length > MAX_TOASTS) el.lastElementChild?.remove();
    setTimeout(() => item.remove(), LIFETIME_MS);
  }
}

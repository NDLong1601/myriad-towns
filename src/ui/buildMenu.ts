import type { City } from '@/sim/city';
import type { History } from '@/sim/commands';
import { thumbnail } from '@/render/thumbnails';
import { buildCategory } from '@/ui/buildCategory';
import { buildingName, t } from './i18n';

export type Tool = { kind: 'none' } | { kind: 'build'; defId: string } | { kind: 'demolish' };

export interface BuildMenu {
  readonly tools: HTMLElement;
  setTool(tool: Tool): void;
  readonly tool: Tool;
  onToolChange(fn: (tool: Tool) => void): void;
}

const CATEGORY_PATHS: Record<string, string> = {
  infrastructure: 'M3 21 8 3m8 0 5 18M12 3v4m0 3v4m0 3v4',
  housing: 'm3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7',
  food: 'M12 21v-9m0 3c-6 0-8-3-8-8 4 0 8 2 8 8Zm0-3c0-6 3-9 8-9 0 5-3 9-8 9Z',
  production: 'M3 21V10l6 4V9l6 4V3h4l2 18H3Zm4-3h2m3 0h2m3 0h2',
  service: 'M4 21h16M5 9v10m7-10v10m7-10v10M3 7l9-4 9 4H3Z',
  nature: 'M12 21v-4m0-14 7 11h-4l2 3H7l2-3H5z',
  culture: 'M3 5h18v14H3zM8 19v-3m8 3v-3M7 10h2m6 0h2m-7 3h4',
};

function categoryIcon(category: string): string {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="${CATEGORY_PATHS[category] ?? 'M5 5h14v14H5z'}"/></svg>`;
}

/** Bottom bar: category tabs, buildings of the current category, and tool buttons. */
export function mountBuildMenu(
  city: City,
  history: History,
  parent: HTMLElement,
  open = true,
): BuildMenu {
  const el = document.createElement('div');
  el.className = 'mt-menu';
  el.innerHTML = `<div class="mt-row"><div class="mt-tabs"></div><div class="mt-tools">
    <button data-tool="demolish" title="${t('ui.demolish')}" aria-label="${t('ui.demolish')}">⛏ <span>${t('ui.demolish').replace(/ \(.*\)/, '')}</span></button>
    <button data-tool="undo" title="${t('ui.undo')}">↶</button>
    <button data-tool="redo" title="${t('ui.redo')}">↷</button>
  </div></div><div class="mt-tray">
    <button type="button" data-scroll="-1" aria-label="${t('ui.buildPrevious')}" title="${t('ui.buildPrevious')}">‹</button>
    <div id="mt-build-items" class="mt-items" tabindex="0" role="region" aria-label="${t('ui.buildList')}"></div>
    <button type="button" data-scroll="1" aria-label="${t('ui.buildNext')}" title="${t('ui.buildNext')}">›</button>
  </div>`;
  parent.appendChild(el);
  const tabs = el.querySelector('.mt-tabs') as HTMLElement;
  const items = el.querySelector('.mt-items') as HTMLElement;
  const arrows = el.querySelectorAll<HTMLButtonElement>('[data-scroll]');
  const syncArrows = (): void => {
    const end = items.scrollWidth - items.clientWidth;
    for (const button of arrows) {
      button.disabled =
        button.dataset.scroll === '-1' ? items.scrollLeft < 1 : items.scrollLeft >= end - 1;
    }
  };
  items.hidden = !open;
  const tools = el.querySelector('.mt-tools') as HTMLElement;
  const undoBtn = el.querySelector('[data-tool=undo]') as HTMLButtonElement;
  const redoBtn = el.querySelector('[data-tool=redo]') as HTMLButtonElement;
  const demolishBtn = el.querySelector('[data-tool=demolish]') as HTMLButtonElement;

  const cats = [...city.catalog.categories].sort((a, b) =>
    a === 'infrastructure' ? -1 : b === 'infrastructure' ? 1 : 0,
  );
  const defs = [...city.catalog.defs];
  const road = defs.findIndex((def) => def.id === 'road');
  if (road > 0) defs.unshift(...defs.splice(road, 1));
  let category = cats[0] ?? 'housing';
  let tool: Tool = { kind: 'none' };
  const listeners: ((t: Tool) => void)[] = [];

  tabs.innerHTML = cats
    .map((c) => {
      const label = t(`category.${c}`);
      return `<button data-cat="${c}" aria-label="${label}" title="${label}" aria-controls="${items.id}">${categoryIcon(c)}<span>${label}</span></button>`;
    })
    .join('');
  const tabButtons = tabs.querySelectorAll<HTMLButtonElement>('button');
  const renderTabs = (): void => {
    for (const button of tabButtons) {
      const expanded = !items.hidden && button.dataset.cat === category;
      button.classList.toggle('active', expanded);
      button.setAttribute('aria-expanded', String(expanded));
    }
  };
  let itemMarkup = '';
  const renderItems = (): void => {
    const html = defs
      .filter(
        (d) =>
          buildCategory(d) === category &&
          !d.tags?.includes('upgrade_only') &&
          city.progress.isRevealed(d),
      )
      .map((d) => ({ d, lock: city.progress.lockReason(d) }))
      .sort((a, b) => Number(Boolean(a.lock)) - Number(Boolean(b.lock)))
      .map(({ d, lock }) => {
        const active = tool.kind === 'build' && tool.defId === d.id ? ' active' : '';
        const url = thumbnail(d);
        const img = url
          ? `<img class="mt-thumb" src="${url}" alt="" width="44" height="44" draggable="false">`
          : categoryIcon(category);
        const poor = city.canAfford(d.cost) ? '' : ' poor';
        const size = `${d.footprint.w}×${d.footprint.d}`;
        const name = buildingName(d.id);
        const needs = lock ? ` · ${t('ui.buildLocked')}` : '';
        return `<button type="button" class="mt-item${lock ? ' locked' : ''}${active}${poor}" data-def="${d.id}" aria-label="${name}${needs}" aria-pressed="${Boolean(active)}" title="${name} · ${size}${needs}">${img}<span class="mt-item-text">${name}</span>${lock ? '<span class="mt-build-lock" aria-hidden="true">🔒</span>' : poor ? '<span class="mt-build-poor" aria-hidden="true">!</span>' : ''}</button>`;
      })
      .join('');
    if (html !== itemMarkup) {
      const focused = document.activeElement;
      items.innerHTML = html;
      if (focused instanceof HTMLButtonElement && focused.dataset.def) {
        items.querySelector<HTMLButtonElement>(`[data-def="${focused.dataset.def}"]`)?.focus({
          preventScroll: true,
        });
      }
      itemMarkup = html;
      syncArrows();
    }
    demolishBtn.classList.toggle('active', tool.kind === 'demolish');
    demolishBtn.setAttribute('aria-pressed', String(tool.kind === 'demolish'));
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
  };

  const setTool = (next: Tool): void => {
    tool = next;
    if (next.kind === 'build') {
      const nextCategory = buildCategory(city.catalog.get(next.defId));
      if (nextCategory !== category) items.scrollLeft = 0;
      category = nextCategory;
      items.hidden = false;
      renderTabs();
    }
    renderItems();
    for (const l of listeners) l(tool);
  };

  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    if (b.dataset.scroll) {
      const step = Math.max(56, Math.round(items.clientWidth * 0.7));
      items.scrollBy(Number(b.dataset.scroll) * step, 0);
    } else if (b.dataset.cat) {
      const reopen = items.hidden || b.dataset.cat !== category;
      if (b.dataset.cat !== category) items.scrollLeft = 0;
      category = b.dataset.cat;
      items.hidden = !reopen;
      renderTabs();
      if (!reopen && tool.kind === 'build') setTool({ kind: 'none' });
      else renderItems();
    } else if (b.dataset.def) {
      const same = tool.kind === 'build' && tool.defId === b.dataset.def;
      setTool(same ? { kind: 'none' } : { kind: 'build', defId: b.dataset.def });
    } else if (b.dataset.tool === 'demolish') {
      setTool(tool.kind === 'demolish' ? { kind: 'none' } : { kind: 'demolish' });
    } else if (b.dataset.tool === 'undo') {
      history.undo();
    } else if (b.dataset.tool === 'redo') {
      history.redo();
    }
  });
  // Keep the canvas from treating menu clicks as map clicks.
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  items.addEventListener('scroll', syncArrows);
  new ResizeObserver(syncArrows).observe(items);
  items.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const first = items.firstElementChild;
    const last = items.lastElementChild;
    const target = e.target instanceof HTMLButtonElement ? e.target : null;
    const next =
      e.key === 'Home'
        ? first
        : e.key === 'End'
          ? last
          : e.key === 'ArrowRight'
            ? (target?.nextElementSibling ?? (target ? null : first))
            : (target?.previousElementSibling ?? (target ? null : last));
    if (next instanceof HTMLElement) next.focus();
  });
  let drag: { pointer: number; x: number; left: number } | undefined;
  let dragged = false;
  items.addEventListener('pointerdown', (e) => {
    dragged = false;
    if (e.pointerType !== 'mouse' || e.button !== 0 || items.scrollWidth <= items.clientWidth)
      return;
    drag = { pointer: e.pointerId, x: e.clientX, left: items.scrollLeft };
  });
  items.addEventListener('pointermove', (e) => {
    if (!drag || drag.pointer !== e.pointerId || !e.buttons) return;
    const dx = e.clientX - drag.x;
    if (!dragged && Math.abs(dx) < 5) return;
    if (!dragged) items.setPointerCapture(e.pointerId);
    dragged = true;
    items.scrollLeft = drag.left - dx;
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    items.addEventListener(name, () => {
      drag = undefined;
    });
  }
  items.addEventListener(
    'click',
    (e) => {
      if (dragged && e.detail) {
        dragged = false;
        e.stopImmediatePropagation();
      }
    },
    { capture: true },
  );
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape' || e.defaultPrevented || items.hidden) return;
    if (document.querySelector('[aria-modal="true"]:not([hidden], [hidden] *)')) return;
    if (items.contains(document.activeElement)) {
      Array.from(tabButtons)
        .find((button) => button.dataset.cat === category)
        ?.focus();
    }
    items.hidden = true;
    renderTabs();
  });
  for (const row of [tabs, items]) {
    row.addEventListener(
      'wheel',
      (e) => {
        if (e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        if (row.scrollWidth <= row.clientWidth) return;
        e.preventDefault();
        const unit =
          e.deltaMode === WheelEvent.DOM_DELTA_LINE
            ? 16
            : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
              ? row.clientWidth
              : 1;
        row.scrollLeft += e.deltaY * unit;
      },
      { passive: false },
    );
  }

  city.on((e) => {
    if (e.type === 'stock' || e.type === 'unlocked') renderItems();
  });
  history.onChange(renderItems);
  renderTabs();
  renderItems();

  return {
    tools,
    setTool,
    get tool() {
      return tool;
    },
    onToolChange: (fn) => listeners.push(fn),
  };
}

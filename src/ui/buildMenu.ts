import type { City } from '@/sim/city';
import type { History } from '@/sim/commands';
import { thumbnail } from '@/render/thumbnails';
import { buildingName, t } from './i18n';
import { amountsHtml } from './icons';

export type Tool = { kind: 'none' } | { kind: 'build'; defId: string } | { kind: 'demolish' };

export interface BuildMenu {
  readonly tools: HTMLElement;
  setTool(tool: Tool): void;
  readonly tool: Tool;
  onToolChange(fn: (tool: Tool) => void): void;
}

/** Bottom bar: category tabs, buildings of the current category, and tool buttons. */
export function mountBuildMenu(city: City, history: History, parent: HTMLElement): BuildMenu {
  const el = document.createElement('div');
  el.className = 'mt-menu';
  el.innerHTML = `<div class="mt-row"><div class="mt-tabs"></div><div class="mt-tools">
    <button data-tool="demolish" title="${t('ui.demolish')}" aria-label="${t('ui.demolish')}">⛏ <span>${t('ui.demolish').replace(/ \(.*\)/, '')}</span></button>
    <button data-tool="undo" title="${t('ui.undo')}">↶</button>
    <button data-tool="redo" title="${t('ui.redo')}">↷</button>
  </div></div><div id="mt-build-items" class="mt-items"></div>`;
  parent.appendChild(el);
  const tabs = el.querySelector('.mt-tabs') as HTMLElement;
  const items = el.querySelector('.mt-items') as HTMLElement;
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
    .map(
      (c) => `<button data-cat="${c}" aria-controls="${items.id}">${t(`category.${c}`)}</button>`,
    )
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
          d.category === category &&
          !d.tags?.includes('upgrade_only') &&
          city.progress.isRevealed(d),
      )
      .map((d) => {
        const active = tool.kind === 'build' && tool.defId === d.id ? ' active' : '';
        const url = thumbnail(d);
        const img = url ? `<img class="mt-thumb" src="${url}" alt="" width="44" height="44">` : '';
        const poor = city.canAfford(d.cost) ? '' : ' poor';
        const size = `${d.footprint.w}×${d.footprint.d}`;
        const lock = city.progress.lockReason(d);
        if (lock) {
          // Locked buildings stay visible (greyed) with what unlocks them.
          const need =
            lock.key === 'req.pack'
              ? t('ui.packLocked', { pack: t(`pack.${lock.params.pack}`) })
              : t('ui.unlockAt', { n: lock.params.pop });
          return `<button class="mt-item locked${active}" data-def="${d.id}" title="${need}">${img}<span class="mt-item-text"><span>🔒 ${buildingName(d.id)}</span><small>${size} · ${need}</small></span></button>`;
        }
        return `<button class="mt-item${active}${poor}" data-def="${d.id}">${img}<span class="mt-item-text"><span>${buildingName(d.id)}</span><small>${size} · ${amountsHtml(d.cost) || '—'}</small></span></button>`;
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
    }
    demolishBtn.classList.toggle('active', tool.kind === 'demolish');
    demolishBtn.setAttribute('aria-pressed', String(tool.kind === 'demolish'));
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
  };

  const setTool = (next: Tool): void => {
    tool = next;
    if (next.kind === 'build') {
      const nextCategory = city.catalog.get(next.defId).category;
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
    if (b.dataset.cat) {
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

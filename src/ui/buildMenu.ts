import type { City } from '@/sim/city';
import type { History } from '@/sim/commands';
import { thumbnail } from '@/render/thumbnails';
import { buildingName, t } from './i18n';
import { amountsHtml } from './icons';

export type Tool = { kind: 'none' } | { kind: 'build'; defId: string } | { kind: 'demolish' };

export interface BuildMenu {
  setTool(tool: Tool): void;
  readonly tool: Tool;
  onToolChange(fn: (tool: Tool) => void): void;
}

/** Bottom bar: category tabs, buildings of the current category, and tool buttons. */
export function mountBuildMenu(city: City, history: History, parent: HTMLElement): BuildMenu {
  const el = document.createElement('div');
  el.className = 'mt-menu';
  el.innerHTML = `<div class="mt-row"><div class="mt-tabs"></div><div class="mt-tools">
    <button data-tool="demolish" title="${t('ui.demolish')}">⛏ ${t('ui.demolish').replace(/ \(.*\)/, '')}</button>
    <button data-tool="undo" title="${t('ui.undo')}">↶</button>
    <button data-tool="redo" title="${t('ui.redo')}">↷</button>
  </div></div><div class="mt-items"></div>`;
  parent.appendChild(el);
  const tabs = el.querySelector('.mt-tabs') as HTMLElement;
  const items = el.querySelector('.mt-items') as HTMLElement;
  const undoBtn = el.querySelector('[data-tool=undo]') as HTMLButtonElement;
  const redoBtn = el.querySelector('[data-tool=redo]') as HTMLButtonElement;
  const demolishBtn = el.querySelector('[data-tool=demolish]') as HTMLButtonElement;

  const cats = [...city.catalog.categories].sort((a, b) =>
    a === 'infrastructure' ? -1 : b === 'infrastructure' ? 1 : 0,
  );
  let category = cats[0] ?? 'housing';
  let tool: Tool = { kind: 'none' };
  const listeners: ((t: Tool) => void)[] = [];

  const renderTabs = (): void => {
    tabs.innerHTML = cats
      .map(
        (c) =>
          `<button data-cat="${c}" class="${c === category ? 'active' : ''}">${t(`category.${c}`)}</button>`,
      )
      .join('');
  };
  const renderItems = (): void => {
    items.innerHTML = city.catalog.defs
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
    demolishBtn.classList.toggle('active', tool.kind === 'demolish');
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
  };

  const setTool = (next: Tool): void => {
    tool = next;
    renderItems();
    for (const l of listeners) l(tool);
  };

  el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    if (b.dataset.cat) {
      category = b.dataset.cat;
      renderTabs();
      renderItems();
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

  city.on((e) => {
    if (e.type === 'stock' || e.type === 'unlocked') renderItems();
  });
  history.onChange(renderItems);
  renderTabs();
  renderItems();

  return {
    setTool,
    get tool() {
      return tool;
    },
    onToolChange: (fn) => listeners.push(fn),
  };
}

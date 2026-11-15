import './encyclopedia.css';
import type { BuildingDef, Catalog, Requirement } from '@/sim/catalog';
import type { BuildMenu } from './buildMenu';
import { buildingName, fmt, formatAmounts, t } from './i18n';

/**
 * Normalizes text for case-insensitive and diacritic-insensitive search.
 * Handles Vietnamese accents, decompositions (NFD), and converts 'đ'/'Đ' to 'd'.
 */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Pure function to filter building definitions by search query and category.
 */
export function filterBuildings(
  defs: readonly BuildingDef[],
  query: string,
  category: string,
  nameOf: (def: BuildingDef) => string,
): BuildingDef[] {
  const q = normalizeText(query);
  const cat = category.trim();
  const filterCat = cat !== '' && cat !== 'all';

  return defs.filter((def) => {
    if (filterCat && def.category !== cat) return false;
    if (!q) return true;
    const name = normalizeText(nameOf(def));
    return name.includes(q);
  });
}

/**
 * Computes a reverse map of building upgrades: targetDefId -> sourceDefId[].
 */
export function buildUpgradedFromMap(defs: readonly BuildingDef[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const d of defs) {
    for (const u of d.upgrades ?? []) {
      const list = map.get(u.to) ?? [];
      if (!list.includes(d.id)) list.push(d.id);
      map.set(u.to, list);
    }
  }
  return map;
}

/**
 * Formats a static requirement definition as localized text without evaluation.
 */
export function formatRequirement(req: Requirement): string {
  switch (req.type) {
    case 'near':
      return t('encyclopedia.req.near', {
        need: req.min ?? 1,
        building: buildingName(req.building),
        r: req.radius,
      });
    case 'notNear':
      return t('encyclopedia.req.notNear', {
        building: buildingName(req.building),
        r: req.radius,
      });
    case 'field':
      if (req.min !== undefined && req.max !== undefined) {
        return `${t('field.' + req.field)}: ${req.min} – ${req.max}`;
      } else if (req.min !== undefined) {
        return t('encyclopedia.req.fieldMin', {
          field: t('field.' + req.field),
          min: req.min,
        });
      } else {
        return t('encyclopedia.req.fieldMax', {
          field: t('field.' + req.field),
          max: req.max ?? 0,
        });
      }
    case 'terrain':
      return t('encyclopedia.req.terrain', {
        need: req.min ?? 1,
        terrain: t('terrain.' + req.terrain),
        r: req.radius,
      });
    case 'road':
      return t('encyclopedia.req.road', {
        d: req.maxDistance,
      });
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export interface EncyclopediaHandle {
  open(): void;
  close(): void;
  isOpen(): boolean;
}

/**
 * Mounts the building encyclopedia modal and launcher button.
 */
export function mountEncyclopedia(
  parent: HTMLElement,
  catalog: Catalog,
  buildMenu: BuildMenu,
): EncyclopediaHandle {
  const upgradedFromMap = buildUpgradedFromMap(catalog.defs);

  // Backdrop and modal container
  const backdrop = document.createElement('div');
  backdrop.className = 'mt-encyclopedia-backdrop';
  backdrop.hidden = true;

  const modal = document.createElement('div');
  modal.className = 'mt-encyclopedia-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'mt-encyclopedia-title');

  // Header
  const header = document.createElement('div');
  header.className = 'mt-encyclopedia-header';
  header.innerHTML = `
    <h2 id="mt-encyclopedia-title">${esc(t('encyclopedia.title'))}</h2>
    <button type="button" class="mt-encyclopedia-close" aria-label="${esc(t('encyclopedia.close'))}">✕</button>
  `;

  // Controls (Search + Categories)
  const controls = document.createElement('div');
  controls.className = 'mt-encyclopedia-controls';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'mt-encyclopedia-search';
  searchInput.placeholder = t('encyclopedia.searchPlaceholder');
  searchInput.setAttribute('aria-label', t('encyclopedia.searchPlaceholder'));

  // Prevent input key events from bubbling to buildTool / cameraController
  searchInput.addEventListener('keydown', (e) => e.stopPropagation());
  searchInput.addEventListener('keyup', (e) => e.stopPropagation());

  const categoriesContainer = document.createElement('div');
  categoriesContainer.className = 'mt-encyclopedia-categories';

  let currentCategory = 'all';

  const cats = ['all', ...catalog.categories];
  for (const cat of cats) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mt-encyclopedia-cat' + (cat === currentCategory ? ' active' : '');
    btn.dataset.cat = cat;
    btn.textContent = cat === 'all' ? t('encyclopedia.allCategories') : t(`category.${cat}`);
    categoriesContainer.appendChild(btn);
  }

  controls.appendChild(searchInput);
  controls.appendChild(categoriesContainer);

  // List container
  const list = document.createElement('div');
  list.className = 'mt-encyclopedia-list';
  list.setAttribute('role', 'list');

  modal.appendChild(header);
  modal.appendChild(controls);
  modal.appendChild(list);
  backdrop.appendChild(modal);
  parent.appendChild(backdrop);

  // Launcher button
  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'mt-encyclopedia-btn';
  openBtn.title = `${t('encyclopedia.title')} (B)`;
  openBtn.setAttribute('aria-label', t('encyclopedia.title'));
  openBtn.innerHTML =
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-2-5-3-9-2v14c4-1 7 0 9 2 2-2 5-3 9-2V4c-4-1-7 0-9 2Zm0 0v14"/></svg>';
  buildMenu.tools.appendChild(openBtn);

  let active = false;

  const renderCard = (def: BuildingDef): string => {
    const costText = formatAmounts(def.cost) || '—';
    const housingText = def.housing ? t('ui.housing', { n: def.housing }) : '';
    const producesText = def.produces ? formatAmounts(def.produces) : '';
    const upkeepText = def.upkeep ? formatAmounts(def.upkeep) : '';

    const emits = def.emits ?? [];
    const requires = def.requires ?? [];
    const upgrades = def.upgrades ?? [];
    const fromList = upgradedFromMap.get(def.id) ?? [];

    const details: string[] = [];

    // Footprint & Cost
    details.push(`
      <div class="mt-encyclopedia-row">
        <span>${esc(t('encyclopedia.footprint', { w: def.footprint.w, d: def.footprint.d }))}</span>
        <span>·</span>
        <span class="mt-encyclopedia-label">${esc(t('ui.cost'))}:</span>
        <span>${esc(costText)}</span>
      </div>
    `);

    // Housing
    if (housingText) {
      details.push(`<div class="mt-encyclopedia-row">${esc(housingText)}</div>`);
    }

    // Produces / Upkeep
    if (producesText) {
      details.push(`
        <div class="mt-encyclopedia-row">
          <span class="mt-encyclopedia-label">${esc(t('ui.produces'))}:</span>
          <span>${esc(producesText)}</span>
        </div>
      `);
    }
    if (upkeepText) {
      details.push(`
        <div class="mt-encyclopedia-row">
          <span class="mt-encyclopedia-label">${esc(t('ui.upkeep'))}:</span>
          <span>${esc(upkeepText)}</span>
        </div>
      `);
    }

    // Emits
    if (emits.length > 0) {
      const emitItems = emits
        .map((e) =>
          esc(
            t('encyclopedia.emit', {
              amount: fmt(e.amount),
              field: t(`field.${e.field}`),
              r: e.radius,
            }),
          ),
        )
        .join(', ');
      details.push(`
        <div class="mt-encyclopedia-row">
          <span class="mt-encyclopedia-label">${esc(t('ui.emits'))}:</span>
          <span>${emitItems}</span>
        </div>
      `);
    }

    // Requirements
    if (requires.length > 0) {
      const reqList = requires.map((r) => `<li>${esc(formatRequirement(r))}</li>`).join('');
      details.push(`
        <div>
          <div class="mt-encyclopedia-section-title">${esc(t('encyclopedia.requires'))}</div>
          <ul class="mt-encyclopedia-items">${reqList}</ul>
        </div>
      `);
    }

    // Upgrades to
    if (upgrades.length > 0) {
      const upList = upgrades
        .map((u) => {
          const toName = buildingName(u.to);
          const conds = u.when.map(formatRequirement).join(', ');
          return `<li><strong>${esc(toName)}</strong>${conds ? ` (${esc(conds)})` : ''}</li>`;
        })
        .join('');
      details.push(`
        <div>
          <div class="mt-encyclopedia-section-title">${esc(t('encyclopedia.upgradesTo'))}</div>
          <ul class="mt-encyclopedia-items">${upList}</ul>
        </div>
      `);
    }

    // Upgraded from
    if (fromList.length > 0) {
      const fromNames = fromList.map(buildingName).join(', ');
      details.push(`
        <div class="mt-encyclopedia-row">
          <span class="mt-encyclopedia-label">${esc(t('encyclopedia.upgradedFrom'))}</span>
          <span>${esc(fromNames)}</span>
        </div>
      `);
    }

    return `
      <article class="mt-encyclopedia-card" data-def="${esc(def.id)}" role="listitem">
        <div>
          <div class="mt-encyclopedia-card-header">
            <h3 class="mt-encyclopedia-card-title">${esc(buildingName(def.id))}</h3>
            <span class="mt-encyclopedia-badge">${esc(t(`category.${def.category}`))}</span>
          </div>
          <div class="mt-encyclopedia-body">
            ${details.join('')}
          </div>
        </div>
        <div class="mt-encyclopedia-card-footer">
          ${def.tags?.includes('upgrade_only') ? `<span>${esc(t('req.upgradeOnly'))}</span>` : `<button type="button" class="mt-encyclopedia-build-btn" data-build="${esc(def.id)}">${esc(t('encyclopedia.build'))}</button>`}
        </div>
      </article>
    `;
  };

  const renderList = (): void => {
    const filtered = filterBuildings(catalog.defs, searchInput.value, currentCategory, (d) =>
      buildingName(d.id),
    );

    if (filtered.length === 0) {
      list.innerHTML = `<div class="mt-encyclopedia-empty">${esc(t('encyclopedia.empty'))}</div>`;
      return;
    }

    list.innerHTML = filtered.map(renderCard).join('');
  };

  const open = (): void => {
    active = true;
    backdrop.hidden = false;
    renderList();
    searchInput.focus();
  };

  const close = (): void => {
    active = false;
    backdrop.hidden = true;
  };

  // Category buttons click
  categoriesContainer.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-cat]');
    if (!btn || !btn.dataset.cat) return;
    currentCategory = btn.dataset.cat;
    for (const b of categoriesContainer.querySelectorAll<HTMLButtonElement>(
      '.mt-encyclopedia-cat',
    )) {
      b.classList.toggle('active', b.dataset.cat === currentCategory);
    }
    renderList();
  });

  // Search input change
  searchInput.addEventListener('input', () => {
    renderList();
  });

  // Build button clicks inside the list
  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-build]');
    if (!btn || !btn.dataset.build) return;
    const defId = btn.dataset.build;
    buildMenu.setTool({ kind: 'build', defId });
    close();
  });

  // Close button and backdrop click
  header.querySelector('.mt-encyclopedia-close')?.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  // Open button click
  openBtn.addEventListener('click', () => {
    if (active) close();
    else open();
  });

  // Prevent clicks inside panel and button from triggering game map clicks
  backdrop.addEventListener('pointerdown', (e) => e.stopPropagation());
  openBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

  // Keyboard shortcut: B toggles panel when focus is not in an input
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.code === 'KeyB' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (active) close();
      else open();
    }
  });

  // When modal is open: Esc closes modal and stops propagation so tool is not cancelled
  window.addEventListener(
    'keydown',
    (e) => {
      if (active && e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    },
    { capture: true },
  );

  return {
    open,
    close,
    isOpen: () => active,
  };
}

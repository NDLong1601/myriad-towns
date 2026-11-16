import type { Amounts } from '@/sim/catalog';
import { TICK_HZ } from '@/sim/clock';
import { thumbnail } from '@/render/thumbnails';
import type { BuildingDef } from '@/sim/catalog';
import { buildingName, t } from './i18n';
import { amountsHtml } from './icons';
import type { PanelLine } from './infoPanel';

/** One step up the upgrade chain: what it becomes and what it takes. */
export interface DetailNext {
  def: BuildingDef;
  lines: PanelLine[];
}

export interface DetailContent {
  def: BuildingDef;
  /** Cost of placing it (shown when choosing from the menu). */
  cost?: Amounts;
  /** "Why?" lines for a placed building. */
  status?: PanelLine[];
  /** What it needs to stay healthy (or to be placed). */
  conditions: PanelLine[];
  next: DetailNext[];
  action?: { label: string; run: () => void };
}

const esc = (s: string): string => s.replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`);

function lines(ls: PanelLine[]): string {
  const cls = (ok?: boolean): string => (ok === undefined ? 'info' : ok ? 'ok' : 'bad');
  return `<ul>${ls.map((l) => `<li class="${cls(l.ok)}">${esc(l.text)}</li>`).join('')}</ul>`;
}

function picture(def: BuildingDef, cls: string): string {
  const url = thumbnail(def);
  return url
    ? `<img class="${cls}" src="${url}" alt="${esc(buildingName(def.id))}" width="96" height="96">`
    : '';
}

/** HTML for the right-hand detail panel. Pure, so it can be unit tested. */
export function detailHtml(c: DetailContent): string {
  const d = c.def;
  const stats: string[] = [];
  if (d.housing) stats.push(`<li>${esc(t('ui.housing', { n: d.housing }))}</li>`);
  if (d.produces)
    stats.push(`<li>${amountsHtml(d.produces, '+')} <small>${t('ui.perSecond')}</small></li>`);
  if (d.upkeep)
    stats.push(`<li>${amountsHtml(d.upkeep, '−')} <small>${t('ui.perSecond')}</small></li>`);
  if (d.storage) stats.push(`<li>${esc(t('ui.storage'))} · ${amountsHtml(d.storage)}</li>`);
  if (d.crop) stats.push(`<li>${esc(t('crop.cycle'))}</li>`);
  if (d.voyage)
    stats.push(`<li>${esc(t('voyage.delivery', { s: d.voyage.ticks / TICK_HZ }))}</li>`);
  for (const e of d.emits ?? []) {
    stats.push(
      `<li>${esc(t('ui.emits'))}: ${esc(t(`field.${e.field}`))} ${e.amount > 0 ? '+' : ''}${e.amount} (r=${e.radius})</li>`,
    );
  }
  const next = c.next.length
    ? c.next
        .map(
          (n) =>
            `<div class="mt-next">${picture(n.def, 'mt-next-img')}<div><b>${esc(buildingName(n.def.id))}</b>${lines(n.lines)}</div></div>`,
        )
        .join('')
    : `<p class="mt-muted">${esc(t('ui.topLevel'))}</p>`;
  return (
    `<div class="mt-detail-head">${picture(d, 'mt-detail-img')}<div>` +
    `<h3>${esc(buildingName(d.id))}</h3>` +
    `<div class="mt-muted">${esc(t(`category.${d.category}`))}</div>` +
    (c.cost ? `<div class="mt-cost">${amountsHtml(c.cost) || '—'}</div>` : '') +
    `</div></div>` +
    (stats.length ? `<ul class="mt-stats">${stats.join('')}</ul>` : '') +
    (c.status?.length ? `<div class="mt-sub">${esc(t('ui.status'))}</div>${lines(c.status)}` : '') +
    (c.conditions.length
      ? `<div class="mt-sub">${esc(t('ui.requirements'))}</div>${lines(c.conditions)}`
      : '') +
    `<div class="mt-sub">${esc(t('ui.nextLevel'))}</div>${next}` +
    (c.action ? `<button type="button" data-act="action">${esc(c.action.label)}</button>` : '')
  );
}

/**
 * The panel on the right: the building you are about to place or have selected, what it
 * needs, and what it can become. The cursor card keeps the live yes/no for the hovered site.
 */
export class DetailPanel {
  private readonly el: HTMLElement;
  private action: (() => void) | undefined;
  private lastHtml = '';

  constructor(parent: HTMLElement) {
    this.el = document.createElement('aside');
    this.el.className = 'mt-detail';
    this.el.hidden = true;
    this.el.setAttribute('aria-label', t('ui.details'));
    this.el.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-act=action]')) this.action?.();
    });
    parent.appendChild(this.el);
  }

  show(c: DetailContent): void {
    this.action = c.action?.run;
    const html = detailHtml(c);
    // Rebuilding identical content on every hover would reset scrolling and cost layout.
    if (html !== this.lastHtml) {
      this.el.innerHTML = html;
      this.lastHtml = html;
    }
    this.el.hidden = false;
  }

  hide(): void {
    this.el.hidden = true;
    this.action = undefined;
    this.lastHtml = '';
  }

  get visible(): boolean {
    return !this.el.hidden;
  }
}

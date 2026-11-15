import { STOCK_RESOURCES, type Amounts } from '@/sim/catalog';
import { fmt, t } from './i18n';

/** Workforce icons stay visually distinct from stockpile items. */
const SHAPES: Record<string, string> = {
  labor:
    '<circle cx="12" cy="7" r="3.6" fill="#5b7a99"/><path d="M4.5 21c0-5 3-8 7.5-8s7.5 3 7.5 8z" fill="#5b7a99"/>',
  skilled:
    '<circle cx="12" cy="7" r="3.6" fill="#3f9f6a"/><path d="M4.5 21c0-5 3-8 7.5-8s7.5 3 7.5 8z" fill="#3f9f6a"/><path d="M9.5 15.5 12 18l2.5-2.5" fill="none" stroke="#fff" stroke-width="1.4"/>',
  expert:
    '<circle cx="12" cy="7" r="3.6" fill="#d9a21b"/><path d="M4.5 21c0-5 3-8 7.5-8s7.5 3 7.5 8z" fill="#d9a21b"/><path d="m12 14.2.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" fill="#fff"/>',
  coal: '<path d="m4 14 3-7 7-3 6 5-2 8-8 3z" fill="#2b2d30"/><path d="m7 7 4 3-1 6-4-2z" fill="#44474d"/>',
};

/** Fallback glyph for a resource without a drawn icon. */
const UNKNOWN =
  '<circle cx="12" cy="12" r="8" fill="#9aa1a8"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.7" fill="none" stroke="#fff" stroke-width="1.6"/>';

export function hasIcon(resource: string): boolean {
  return STOCK_RESOURCES.includes(resource) || Object.hasOwn(SHAPES, resource);
}

/** Resource icon with a localized accessible label and tooltip. */
export function icon(resource: string): string {
  const name = t(`resource.${resource}`);
  if (STOCK_RESOURCES.includes(resource)) {
    const src = `${import.meta.env.BASE_URL}icons/resources/${resource}.webp`;
    return `<img class="mt-ico" src="${src}" alt="${name}" title="${name}" draggable="false">`;
  }
  return `<svg class="mt-ico" viewBox="0 0 24 24" role="img" aria-label="${name}"><title>${name}</title>${SHAPES[resource] ?? UNKNOWN}</svg>`;
}

/** "6 [wood icon]  8 [stone icon]" as HTML; each amount keeps its name as a tooltip. */
export function amountsHtml(a: Amounts | undefined, sign = ''): string {
  if (!a) return '';
  return Object.entries(a)
    .map(([r, n]) => `<span class="mt-amt">${sign}${fmt(n)}${icon(r)}</span>`)
    .join('');
}

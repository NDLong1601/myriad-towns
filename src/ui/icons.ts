import type { Amounts } from '@/sim/catalog';
import { fmt, t } from './i18n';

/**
 * Small inline SVG icons for resources (24×24 viewBox). Drawn here so there is nothing to
 * download and they scale and recolour with the page.
 */
const SHAPES: Record<string, string> = {
  food: '<circle cx="12" cy="14" r="7.5" fill="#e5534b"/><path d="M12 7.2c-.2-3 1.6-4.6 4.2-4.8-.1 3-1.7 4.6-4.2 4.8z" fill="#4caf50"/><circle cx="9.4" cy="12" r="1.6" fill="#fff" opacity=".35"/>',
  wood: '<rect x="2.5" y="7.5" width="19" height="11" rx="3" fill="#a9703c"/><ellipse cx="18.5" cy="13" rx="3.2" ry="5.5" fill="#e3b078"/><ellipse cx="18.5" cy="13" rx="1.4" ry="2.6" fill="none" stroke="#a9703c" stroke-width="1"/><path d="M5 11h8M5 15h6" stroke="#7d4f27" stroke-width="1.2" stroke-linecap="round"/>',
  stone:
    '<path d="M2.5 19.5 6 9.5l6.5-3 7 5.5 2 7.5z" fill="#9aa1a8"/><path d="M6 9.5l6.5-3 7 5.5-7.5 1.5z" fill="#c4cad0"/><path d="M12 13.5l-1 6" stroke="#6e757c" stroke-width="1.2"/>',
  ore: '<path d="M3 19 5.5 9l7-3.5 7 4.5 2 9z" fill="#4d5560"/><circle cx="9" cy="13" r="1.7" fill="#e8943a"/><circle cx="15" cy="12" r="1.4" fill="#e8943a"/><circle cx="12.5" cy="16.5" r="1.3" fill="#f2b45a"/>',
  metal:
    '<path d="M3 17 6.5 9h11L21 17z" fill="#8fa6bd"/><path d="M6.5 9h11l-1.8 3.2H8.3z" fill="#c7d6e5"/><path d="M3 17h18" stroke="#5f768d" stroke-width="1.4"/>',
  goods:
    '<rect x="3.5" y="7" width="17" height="13" rx="1.5" fill="#c98f4f"/><path d="M3.5 11.5h17" stroke="#8b5e2c" stroke-width="1.4"/><rect x="10" y="7" width="4" height="13" fill="#e2b072"/><path d="M8 7l4-3.5L16 7" fill="none" stroke="#8b5e2c" stroke-width="1.3" stroke-linejoin="round"/>',
  energy:
    '<path d="M13.5 2 5 13.5h5.5L9.5 22 19 9.5h-5.8z" fill="#f4c20d" stroke="#c99700" stroke-width="1" stroke-linejoin="round"/>',
  knowledge:
    '<path d="M3 5.5c3-1.4 6-1.4 9 .6 3-2 6-2 9-.6v13c-3-1.4-6-1.4-9 .6-3-2-6-2-9-.6z" fill="#3f7bd9"/><path d="M12 6.1v13" stroke="#fff" stroke-width="1.2" opacity=".8"/><path d="M5.5 9c1.6-.4 3.2-.4 4.6.2M5.5 12c1.6-.4 3.2-.4 4.6.2" stroke="#fff" stroke-width="1" opacity=".6" fill="none"/>',
  charter:
    '<path d="M6 3h11a2 2 0 0 1 2 2v13a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 1-2z" fill="#f0e2b6" stroke="#b79b55" stroke-width="1"/><path d="M8.5 8h7M8.5 11h7M8.5 14h4" stroke="#8a7438" stroke-width="1.2" stroke-linecap="round"/><circle cx="16" cy="17" r="2.6" fill="#c8483c"/>',
  labor:
    '<circle cx="12" cy="7" r="3.6" fill="#5b7a99"/><path d="M4.5 21c0-5 3-8 7.5-8s7.5 3 7.5 8z" fill="#5b7a99"/>',
  skilled:
    '<circle cx="12" cy="7" r="3.6" fill="#3f9f6a"/><path d="M4.5 21c0-5 3-8 7.5-8s7.5 3 7.5 8z" fill="#3f9f6a"/><path d="M9.5 15.5 12 18l2.5-2.5" fill="none" stroke="#fff" stroke-width="1.4"/>',
  expert:
    '<circle cx="12" cy="7" r="3.6" fill="#d9a21b"/><path d="M4.5 21c0-5 3-8 7.5-8s7.5 3 7.5 8z" fill="#d9a21b"/><path d="m12 14.2.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" fill="#fff"/>',
};

/** Fallback glyph for a resource without a drawn icon. */
const UNKNOWN =
  '<circle cx="12" cy="12" r="8" fill="#9aa1a8"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.7" fill="none" stroke="#fff" stroke-width="1.6"/>';

export function hasIcon(resource: string): boolean {
  return resource in SHAPES;
}

/** Inline icon for a resource; its name is the tooltip and the accessible label. */
export function icon(resource: string): string {
  const name = t(`resource.${resource}`);
  return `<svg class="mt-ico" viewBox="0 0 24 24" role="img" aria-label="${name}"><title>${name}</title>${SHAPES[resource] ?? UNKNOWN}</svg>`;
}

/** "6 [wood icon]  8 [stone icon]" as HTML; each amount keeps its name as a tooltip. */
export function amountsHtml(a: Amounts | undefined, sign = ''): string {
  if (!a) return '';
  return Object.entries(a)
    .map(([r, n]) => `<span class="mt-amt">${sign}${fmt(n)}${icon(r)}</span>`)
    .join('');
}

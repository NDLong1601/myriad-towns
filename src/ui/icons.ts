import { STOCK_RESOURCES, type Amounts } from '@/sim/catalog';
import { fmt, t } from './i18n';

const HUD_PATHS = {
  demolish: 'm15 4 5 5-3 3-5-5 3-3ZM13 8 4 17l3 3 9-9M12 5l5-2 4 4-2 5',
  undo: 'M9 6 4 11l5 5M4 11h10a5 5 0 0 1 5 5v2',
  redo: 'm15 6 5 5-5 5m5-5H10a5 5 0 0 0-5 5v2',
  previous: 'm14 6-6 6 6 6',
  next: 'm10 6 6 6-6 6',
  lock: 'M7 10V8a5 5 0 0 1 10 0v2m-12 0h14v10H5zM12 14v2',
  warning: 'M12 4 3 20h18L12 4Zm0 6v4m0 3h.01',
  info: 'M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0ZM12 11v5m0-8h.01',
  check: 'm5 12 4 4L19 6',
  go: 'M4 12h15m-6-6 6 6-6 6',
  cycle: 'M20 9a8 8 0 0 0-14-3L4 8m0-4v4h4m-4 7a8 8 0 0 0 14 3l2-2m0 4v-4h-4',
  day: 'M16 12a4 4 0 1 1-8 0 4 4 0 1 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',
  night: 'M20 15a9 9 0 1 1-11-11 8 8 0 0 0 11 11Z',
  trade: 'M4 8h16m-4-4 4 4-4 4m4 4H4m4-4-4 4 4 4',
  menu: 'M5 6h14M5 12h14M5 18h14',
  save: 'M4 4h13l3 3v13H4zM8 4v6h8V4M8 20v-6h8v6',
  soundOn: 'M4 9h4l5-4v14l-5-4H4zm12 0a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10',
  soundOff: 'M4 9h4l5-4v14l-5-4H4zm12 1 4 4m0-4-4 4',
  settings: 'M4 6h16M4 12h16M4 18h16M8 4v4m8 2v4m-6 2v4',
} as const;

export function strokeIcon(path: string, size = 20): string {
  return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
}

export function hudIcon(name: keyof typeof HUD_PATHS, size?: number): string {
  return strokeIcon(HUD_PATHS[name], size);
}

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

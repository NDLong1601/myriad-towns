import en from '../../data/i18n/en.json';
import vi from '../../data/i18n/vi.json';
import { loadSettings } from './settingsStore';

type Dict = Record<string, string>;
const DICTS: Record<string, Dict> = { vi, en };

function pickLang(): string {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q && q in DICTS) return q;
    const saved = loadSettings().lang;
    if (saved && saved in DICTS) return saved;
    return 'vi'; // Vietnamese by default; ?lang=en or the settings menu for English
  } catch {
    return 'vi';
  }
}

let lang = typeof window === 'undefined' ? 'vi' : pickLang();

export function setLang(l: string): void {
  if (l in DICTS) lang = l;
}

/** Translate `key`, filling {param} placeholders. Missing keys show the key itself. */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const s = DICTS[lang]?.[key] ?? DICTS.vi?.[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
}

export function buildingName(id: string): string {
  return t(`building.${id}.name`);
}

/** "4 Gỗ, 2 Đá" */
export function formatAmounts(a: Readonly<Record<string, number>> | undefined): string {
  if (!a) return '';
  return Object.entries(a)
    .map(([r, n]) => `${fmt(n)} ${t(`resource.${r}`)}`)
    .join(', ');
}

export function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

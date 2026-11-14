/** Player settings in localStorage (per browser). URL params still win, for tests and links. */
export interface Settings {
  quality?: 'low' | 'medium' | 'high';
  /** View radius in chunks. */
  radius?: number;
  lang?: 'vi' | 'en';
  autosave: boolean;
}

const KEY = 'mt.settings';
const DEFAULTS: Settings = { autosave: true };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage blocked: settings last for this page only.
  }
}

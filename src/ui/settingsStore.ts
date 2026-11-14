/** Player settings in localStorage (per browser). URL params still win, for tests and links. */
export interface Settings {
  quality?: 'low' | 'medium' | 'high';
  /** View radius in chunks. */
  radius?: number;
  lang?: 'vi' | 'en';
  autosave: boolean;
  /** Master volume, 0..1. */
  volume: number;
  muted: boolean;
  dayNight: boolean;
  /** Pedestrians and vehicles on the roads. */
  traffic: boolean;
  /** Draw land flat (true) or as stepped hills. Needs a reload. */
  flatTerrain: boolean;
  /** Corner panels. */
  showMinimap: boolean;
  showHeatmap: boolean;
  palette: 'default' | 'cvd';
}

const KEY = 'mt.settings';
const DEFAULTS: Settings = {
  autosave: true,
  volume: 0.7,
  muted: false,
  dayNight: true,
  traffic: true,
  flatTerrain: true,
  showMinimap: true,
  showHeatmap: true,
  palette: 'default',
};

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

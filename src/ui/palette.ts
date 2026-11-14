import { loadSettings } from './settingsStore';

export type Palette = 'default' | 'cvd';

/**
 * Colourblind-safe palette: "good" is blue and "bad" is orange instead of green and red, and
 * the UI adds a symbol next to every good/bad colour so it never relies on hue alone.
 */
let current: Palette = 'default';

export function setPalette(p: Palette): void {
  current = p;
  document.documentElement.dataset.palette = p;
}

export function palette(): Palette {
  return current;
}

/** Colours the 3D placement preview uses for a valid / invalid site. */
export function previewColors(): { ok: string; bad: string; ghostBad: string } {
  return current === 'cvd'
    ? { ok: '#4da3ff', bad: '#ff9f1a', ghostBad: '#ffc266' }
    : { ok: '#5cd65c', bad: '#ff4d4d', ghostBad: '#ff8080' };
}

export function initPalette(forced: string | null): void {
  const p = forced ?? loadSettings().palette;
  setPalette(p === 'cvd' ? 'cvd' : 'default');
}

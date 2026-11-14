/** What the camera sees around it, sampled a few times per second. */
export interface Surroundings {
  /** 0 by day … 1 at midnight. */
  night: number;
  /** Share of sampled tiles that are water / have trees, 0..1. */
  water: number;
  trees: number;
  /** Buildings near the camera target. */
  buildings: number;
  /** Camera distance from its target (zoom). */
  distance: number;
}

/** Loudness of each ambient bed, 0..1. */
export interface AmbientMix {
  wind: number;
  birds: number;
  crickets: number;
  water: number;
  town: number;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * Ambient mix for the camera's surroundings. Pure, so it is unit tested: zooming out fades
 * the close sounds and brings up the wind; birds by day, crickets by night; a busy town hums.
 */
export function ambientMix(s: Surroundings): AmbientMix {
  const close = 0.25 + 0.75 * clamp01(1 - (s.distance - 20) / 160);
  const town = clamp01(s.buildings / 60) * close;
  const nature = 0.3 + 0.7 * clamp01(s.trees * 2);
  const night = clamp01(s.night);
  return {
    wind: 0.2 + 0.6 * clamp01((s.distance - 40) / 200),
    birds: (1 - night) * nature * (1 - 0.6 * town) * close,
    crickets: night * nature * (1 - 0.5 * town) * close,
    water: clamp01(s.water * 2.5) * close,
    town,
  };
}

import type { BufferGeometry } from 'three';

/**
 * Bakes cheap realism into vertex colours: a soft contact shadow where walls meet the ground
 * and a small deterministic tone variation per part, so stone, brick and roof pieces stop
 * reading as flat paint. Glowing parts (windows, lamps) are left untouched.
 */
export function weather(parts: readonly BufferGeometry[], from: number, seed: string): void {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  for (let i = from; i < parts.length; i++) {
    const g = parts[i]!;
    const color = g.getAttribute('color');
    const pos = g.getAttribute('position');
    const glow = g.getAttribute('glow');
    if (!color || !pos) continue;
    if (glow && glow.count > 0 && glow.getX(0) > 0) continue;
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const tone = 1 + ((h % 1000) / 1000 - 0.5) * 0.09;
    const warm = ((h >>> 10) % 1000) / 1000 - 0.5;
    let top = -Infinity;
    for (let v = 0; v < pos.count; v++) top = Math.max(top, pos.getY(v));
    const grounded = top > 0.08;
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v);
      const t = Math.min(1, Math.max(0, (y - 0.03) / 0.16));
      const ao = grounded ? 0.8 + 0.2 * t * t * (3 - 2 * t) : 1;
      const f = tone * ao;
      color.setXYZ(
        v,
        color.getX(v) * f * (1 + warm * 0.03),
        color.getY(v) * f,
        color.getZ(v) * f * (1 - warm * 0.03),
      );
    }
    color.needsUpdate = true;
  }
}

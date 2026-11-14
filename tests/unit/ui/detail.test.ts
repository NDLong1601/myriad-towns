import { describe, expect, it } from 'vitest';
import resources from '../../../data/resources.json';
import { detailHtml } from '@/ui/detailPanel';
import { amountsHtml, hasIcon, icon } from '@/ui/icons';
import { makeCity } from '../helpers';

describe('resource icons', () => {
  it('every stock and labour resource has a drawn icon', () => {
    for (const r of [...resources.stock, ...resources.labor]) expect(hasIcon(r), r).toBe(true);
  });

  it('labels stockpile images and workforce glyphs with their resource names', () => {
    expect(icon('wood')).toMatch(/^<img[^>]*icons\/resources\/wood\.webp" alt="[^"]+"/);
    expect(icon('labor')).toMatch(/^<svg[^>]*aria-label="[^"]+"/);
  });

  it('amounts show every resource with its number', () => {
    const html = amountsHtml({ wood: 6, stone: 8 }, '+');
    expect(html).toContain('+6');
    expect(html).toContain('+8');
    expect(html.match(/<img/g)).toHaveLength(2);
  });
});

describe('detail panel content', () => {
  const { city } = makeCity();
  const hut = city.catalog.get('hut');
  const cottage = city.catalog.get('cottage');

  it('shows the building, its cost, requirements and the next level', () => {
    const html = detailHtml({
      def: hut,
      cost: hut.cost,
      conditions: [{ ok: true, text: 'Có đường' }],
      next: [{ def: cottage, lines: [{ ok: false, text: 'Cần nước sạch' }] }],
    });
    expect(html).toContain('Lều tranh');
    expect(html).toContain('mt-cost');
    expect(html).toContain('class="ok">Có đường');
    expect(html).toContain('class="bad">Cần nước sạch');
    expect(html).toContain('Nhà gỗ');
  });

  it('says so when there is no next level, and escapes text', () => {
    const html = detailHtml({
      def: hut,
      status: [{ text: '<script>x</script>' }],
      conditions: [],
      next: [],
      action: { label: 'Phá dỡ', run: () => undefined },
    });
    expect(html).toContain('cấp cao nhất');
    expect(html).not.toContain('<script>');
    expect(html).toContain('data-act="action"');
  });
});

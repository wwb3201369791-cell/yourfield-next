import { describe, expect, it } from 'vitest';

import { buildProductDetailNavItems } from '@/lib/content/productDetailNav';

describe('product detail section navigation', () => {
  it('keeps visible detail sections in the old-site reading order', () => {
    const items = buildProductDetailNavItems([
      { id: 'product-intro', label: '商品介绍', show: true },
      { id: 'selling-points', label: '核心卖点', show: true },
      { id: 'specifications', label: '参数规格', show: true },
      { id: 'size-guide', label: '尺码对应表', show: true },
      { id: 'application-scenarios', label: '适用场景', show: true },
      { id: 'visual-gallery', label: '场景图、建模图与模特上身图', show: true },
    ]);

    expect(items.map((item) => item.id)).toEqual([
      'product-intro',
      'selling-points',
      'specifications',
      'size-guide',
      'application-scenarios',
      'visual-gallery',
    ]);
  });

  it('omits empty or unavailable sections', () => {
    expect(
      buildProductDetailNavItems([
        { id: 'product-intro', label: ' 商品介绍 ', show: true },
        { id: 'selling-points', label: '核心卖点', show: false },
        { id: ' ', label: '参数规格', show: true },
        { id: 'faq', label: ' ', show: true },
      ]),
    ).toEqual([{ id: 'product-intro', label: '商品介绍' }]);
  });
});

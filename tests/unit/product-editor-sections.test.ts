import { describe, expect, it } from 'vitest';

import {
  productEditorDetailNavItems,
  productEditorDetailSections,
} from '@/components/admin/product-editor/productEditorSections';

describe('product editor detail sections', () => {
  it('keeps the admin visual editor aligned with the frontend nine-section detail page', () => {
    expect(productEditorDetailNavItems.map((item) => item.label)).toEqual([
      '商品介绍',
      '核心卖点',
      '参数规格',
      '尺码对应表',
      '适用场景',
      '场景图、建模图与模特上身图',
      '资料与认证状态',
      '洗护与维护',
      '常见问题',
    ]);

    expect(productEditorDetailNavItems.map((item) => item.id)).toEqual([
      'product-intro',
      'selling-points',
      'specifications',
      'size-guide',
      'application-scenarios',
      'visual-gallery',
      'quality-evidence',
      'care-instructions',
      'faq',
    ]);
  });

  it('has an edit drawer target and empty hint for every detail module', () => {
    expect(productEditorDetailSections).toHaveLength(9);

    for (const section of productEditorDetailSections) {
      expect(section.section).toBeTruthy();
      expect(section.emptyHint).toBeTruthy();
    }
  });
});

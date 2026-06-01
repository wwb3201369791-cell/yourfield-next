import { describe, expect, it } from 'vitest';

import {
  buildProductDocumentHydrationUrl,
  getProductDocumentIdFromPathname,
  hasVisualEditorSeedValues,
  mergeHydratedVisualEditorValues,
  normalizeProductDocumentForFormReset,
} from '../productEditorHydration';

describe('product editor hydration helpers', () => {
  it('detects when the visual editor still needs document hydration', () => {
    expect(hasVisualEditorSeedValues({})).toBe(false);
    expect(hasVisualEditorSeedValues({ images: [] })).toBe(false);
    expect(hasVisualEditorSeedValues({ name: '干式水域救援服' })).toBe(false);
    expect(hasVisualEditorSeedValues({ productId: 'dry-water-rescue-suit-hyf-9905' })).toBe(false);
    expect(hasVisualEditorSeedValues({ productGroup: { id: 5, name: '水域救援防护' } })).toBe(
      false,
    );
    expect(hasVisualEditorSeedValues({ images: [{ file: null }], name: '干式水域救援服' })).toBe(
      false,
    );
    expect(hasVisualEditorSeedValues({ images: [{ file: 193 }] })).toBe(false);
    expect(hasVisualEditorSeedValues({ images: [{ file: 193 }], name: '干式水域救援服' })).toBe(
      false,
    );
    expect(
      hasVisualEditorSeedValues({
        images: [{ file: '/media/file/product.png' }],
        name: '干式水域救援服',
        productGroup: { id: 5, name: '水域救援防护' },
      }),
    ).toBe(true);
    expect(
      hasVisualEditorSeedValues({
        images: [{ file: '193' }],
        name: '干式水域救援服',
      }),
    ).toBe(false);
    expect(
      hasVisualEditorSeedValues({
        images: [{ file: { sizes: { card: { url: '/media/file/product.png' } } } }],
        model: 'HYF-9905',
        productGroup: { id: 5, name: '水域救援防护' },
      }),
    ).toBe(true);
    expect(
      hasVisualEditorSeedValues({
        images: [{ file: { sizes: { thumbnail: { url: '/media/file/product-thumb.png' } } } }],
        model: 'HYF-9905',
        productGroup: { id: 5, name: '水域救援防护' },
      }),
    ).toBe(true);
    expect(
      hasVisualEditorSeedValues({
        images: [{ file: { thumbnailURL: '/media/file/product-thumb.png' } }],
        model: 'HYF-9905',
        productGroup: { id: 5, name: '水域救援防护' },
      }),
    ).toBe(true);
  });

  it('merges sparse live form values over hydrated documents to avoid stale editor previews', () => {
    expect(mergeHydratedVisualEditorValues({ name: '实时名称' }, null)).toEqual({
      name: '实时名称',
    });
    expect(
      mergeHydratedVisualEditorValues(
        {
          images: [{ file: 194 }],
          name: '新名称',
        },
        {
          description: '旧详情',
          images: [{ file: { url: '/media/old.png' } }],
          name: '旧名称',
        },
      ),
    ).toEqual({
      description: '旧详情',
      images: [{ file: { url: '/media/old.png' } }],
      name: '新名称',
    });
    expect(
      mergeHydratedVisualEditorValues(
        {
          images: [{ file: { url: '/media/new.png' } }],
          name: '新名称',
          productGroup: { id: 5, name: '水域救援防护' },
        },
        {
          description: '旧详情',
          images: [{ file: { url: '/media/old.png' } }],
          name: '旧名称',
        },
      ),
    ).toEqual({
      description: '旧详情',
      images: [{ file: { url: '/media/new.png' } }],
      name: '新名称',
      productGroup: { id: 5, name: '水域救援防护' },
    });
  });

  it('hydrates detail image groups and direct array sections even when hero seed values exist', () => {
    expect(
      hasVisualEditorSeedValues({
        images: [{ file: { url: '/media/main.png' } }],
        name: 'A级阻燃服',
        productGroup: { id: 2, name: '热防护与焊接防护' },
      }),
    ).toBe(true);

    expect(
      mergeHydratedVisualEditorValues(
        {
          images: [{ file: { url: '/media/main.png' } }],
          materials: [{ id: 'placeholder-material', value: '' }],
          name: 'A级阻燃服',
          productGroup: { id: 2, name: '热防护与焊接防护' },
          visualGroups: [{ images: [], title: '场景图', variant: 'scene' }],
        },
        {
          materials: [{ value: '阻燃防护面料' }],
          sellingPoints: [{ title: '阻燃防护', text: '满足现场防护展示。' }],
          visualGroups: [
            {
              images: [{ file: { url: '/media/detail-1.png' } }],
              title: '建模图',
              variant: 'modeling',
            },
          ],
        },
      ),
    ).toMatchObject({
      images: [{ file: { url: '/media/main.png' } }],
      materials: [{ value: '阻燃防护面料' }],
      name: 'A级阻燃服',
      productGroup: { id: 2, name: '热防护与焊接防护' },
      sellingPoints: [{ title: '阻燃防护', text: '满足现场防护展示。' }],
      visualGroups: [
        {
          images: [{ file: { url: '/media/detail-1.png' } }],
          title: '建模图',
          variant: 'modeling',
        },
      ],
    });
  });

  it('normalizes hydrated relationship objects before resetting Payload form state', () => {
    const hydratedDoc = {
      certifications: [{ attachment: { id: 44, url: '/media/cert.pdf' }, name: '证书' }],
      images: [{ file: { id: 11, url: '/media/main.png' } }],
      productGroup: { id: 3, name: '电力电弧与电磁防护' },
      qualityEvidence: [
        { attachment: { id: 'doc-7', url: '/media/report.pdf' }, title: '检测报告' },
      ],
      sellingPoints: [{ icon: { id: 22, url: '/media/icon.png' }, title: '可视化卖点' }],
      visualGroups: [
        {
          images: [{ file: { id: 31, url: '/media/detail-1.png' } }, { file: 32 }],
          title: '建模图',
          variant: 'detail',
        },
      ],
    };

    expect(normalizeProductDocumentForFormReset(hydratedDoc)).toEqual({
      certifications: [{ attachment: 44, name: '证书' }],
      images: [{ file: 11 }],
      productGroup: 3,
      qualityEvidence: [{ attachment: 'doc-7', title: '检测报告' }],
      sellingPoints: [{ icon: 22, title: '可视化卖点' }],
      visualGroups: [
        {
          images: [{ file: 31 }, { file: 32 }],
          title: '建模图',
          variant: 'detail',
        },
      ],
    });
    expect(hydratedDoc.images[0]?.file).toEqual({ id: 11, url: '/media/main.png' });
  });

  it('extracts existing product ids from Payload admin edit paths', () => {
    expect(getProductDocumentIdFromPathname('/admin/collections/products/132')).toBe('132');
    expect(getProductDocumentIdFromPathname('/admin/collections/products/draft-product')).toBe(
      'draft-product',
    );
    expect(getProductDocumentIdFromPathname('/admin/collections/products/create')).toBe('');
  });

  it('builds a no-fallback draft document API URL for the current locale', () => {
    expect(
      buildProductDocumentHydrationUrl({ apiBase: '/payload-api/', id: 132, locale: 'zh' }),
    ).toBe('/payload-api/products/132?depth=2&draft=true&fallback-locale=null&locale=zh');
  });
});

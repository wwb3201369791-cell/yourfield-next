import { describe, expect, it } from 'vitest';

import {
  buildProductDocumentHydrationUrl,
  getProductDocumentIdFromPathname,
  hasVisualEditorSeedValues,
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
      true,
    );
    expect(
      hasVisualEditorSeedValues({
        images: [{ file: { sizes: { card: { url: '/media/file/product.png' } } } }],
        model: 'HYF-9905',
      }),
    ).toBe(true);
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

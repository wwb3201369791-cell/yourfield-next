import { describe, expect, it } from 'vitest';

import {
  hasVisualEditorSeedValues,
  mergeHydratedVisualEditorValues,
} from '@/components/admin/product-editor/utils/productEditorHydration';

describe('product editor hydration', () => {
  it('does not treat bare relationship ids as complete visual-editor seed data', () => {
    expect(
      hasVisualEditorSeedValues({
        images: [{ file: { url: '/media/products/main.png' } }],
        name: 'A级阻燃服',
        productGroup: 3,
      }),
    ).toBe(false);
  });

  it('keeps populated product group relationships from the hydrated document', () => {
    const merged = mergeHydratedVisualEditorValues(
      {
        images: [{ file: 158 }],
        name: 'A级阻燃服',
        productGroup: 3,
      },
      {
        images: [
          {
            file: {
              sizes: { card: { url: 'http://localhost:3000/media/1-25-600x400.png' } },
              url: 'http://localhost:3000/media/1-25.png',
            },
          },
        ],
        name: 'A级阻燃服',
        productGroup: {
          id: 3,
          name: '工业热防护与阻燃工装',
        },
      },
    );

    expect(merged.productGroup).toMatchObject({
      id: 3,
      name: '工业热防护与阻燃工装',
    });
    expect(merged.images).toEqual([
      {
        file: {
          sizes: { card: { url: 'http://localhost:3000/media/1-25-600x400.png' } },
          url: 'http://localhost:3000/media/1-25.png',
        },
      },
    ]);
  });
});

import { describe, expect, it } from 'vitest';

import { buildProductFromFormValues } from '@/lib/content/buildSectionProps';

describe('product size guide form values', () => {
  it('keeps blank table cells in place so size values stay under the right columns', () => {
    const product = buildProductFromFormValues({
      name: '消防服',
      productId: 'fire-suit',
      sizeGuide: {
        columns: [{ label: '50-55' }, { label: '55-65' }, { label: '65-75' }],
        cornerLabel: '身高 cm / 体重 kg',
        rows: [
          {
            label: '168-172',
            values: [{ value: '' }, { value: '170A' }, { value: '170B' }],
          },
        ],
        title: '尺码对应表',
      },
    });

    expect(product.sizeGuide?.rows[0]?.values).toEqual(['', '170A', '170B']);
  });

  it('does not attach a size guide when the product editor leaves the table empty', () => {
    const product = buildProductFromFormValues({
      name: '无尺码产品',
      productId: 'no-size-guide',
      sizeGuide: {
        columns: [],
        cornerLabel: '',
        rows: [],
        title: '',
      },
    });

    expect(product.sizeGuide).toBeUndefined();
  });

  it('uses real image URLs from editor image rows and ignores unresolved media ids', () => {
    const product = buildProductFromFormValues({
      images: [
        { file: 105 },
        { file: '/media/products/main.png' },
        { file: { sizes: { card: { url: '/media/products/card.png' } }, url: '/media/raw.png' } },
        {
          file: { sizes: { card: { url: 'http://localhost:3000/media/products/local-card.png' } } },
        },
      ],
      name: '带图产品',
      productId: 'image-product',
    });

    expect(product.images).toEqual([
      '/media/products/main.png',
      '/media/products/card.png',
      '/media/products/local-card.png',
    ]);
  });

  it('does not use frontend extracted images when editor image rows are empty', () => {
    const product = buildProductFromFormValues({
      images: [],
      model: 'HYF-3803',
      name: '后台未配置图片产品',
      productId: 'cms-product-without-images',
      sku: 'HYF-3803',
    });

    expect(product.image).toBe('');
    expect(product.images).toEqual([]);
  });
});

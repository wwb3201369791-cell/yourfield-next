import { describe, expect, it } from 'vitest';

import { productPrimaryImage, productVisualGroups } from '@/lib/content/productVisuals';
import type { Product } from '@/lib/mock/products';

const text = (value: string) => ({ en: value, ru: value, zh: value });

function product(overrides: Partial<Product> = {}): Product {
  return {
    applications: [],
    categoryId: 'firefighter-suit',
    categoryName: text('消防员灭火防护服'),
    description: text(''),
    faqs: [],
    features: [],
    groupId: 'fire-rescue',
    id: 'firefighter-suit-combat',
    image: '/images/products/extracted/firefighter-suit-combat/image-001.png',
    images: [
      '/images/products/extracted/firefighter-suit-combat/image-001.png',
      '/images/products/extracted/firefighter-suit-combat/image-002.png',
      '/images/products/extracted/firefighter-suit-combat/image-003.png',
    ],
    materials: [],
    model: 'YF-076',
    name: text('消防员灭火防护服（作战款）'),
    specifications: [],
    standards: [],
    ...overrides,
  };
}

describe('product visual grouping', () => {
  it('keeps the firefighter protective suit standard template as the hero image', () => {
    expect(productPrimaryImage(product())).toBe(
      '/images/products/firefighter-protective-suit/modeling-jacket-front.png',
    );
  });

  it('keeps firefighter extra images in the standard template visual groups', () => {
    const groups = productVisualGroups(product());

    expect(groups.map((group) => group.title.zh)).toEqual(['场景图', '建模图', '模特上身图']);
    expect(groups.map((group) => group.images.length)).toEqual([2, 8, 2]);
    expect(groups.flatMap((group) => group.images)).not.toContain(
      '/images/products/extracted/firefighter-suit-combat/image-002.png',
    );
  });

  it('uses CMS visual groups when the backend provides them', () => {
    const groups = productVisualGroups(
      product({
        id: 'custom-product',
        visualGroups: [
          {
            description: text('后台场景图'),
            images: ['/images/custom-scene.jpg'],
            title: text('场景图'),
            variant: 'scene',
          },
        ],
      }),
    );

    expect(productPrimaryImage(product({ id: 'custom-product', image: '/images/main.png' }))).toBe(
      '/images/main.png',
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.images).toEqual(['/images/custom-scene.jpg']);
  });

  it('uses extracted product images as the default gallery for products without a template', () => {
    const groups = productVisualGroups(
      product({
        id: 'arc-flash-suit',
        image: '/images/products/extracted/arc-flash-suit/image-001.png',
        images: [
          '/images/products/extracted/arc-flash-suit/image-001.png',
          '/images/products/extracted/arc-flash-suit/image-002.png',
        ],
      }),
    );

    expect(productPrimaryImage(product({ id: 'arc-flash-suit', image: '/images/main.png' }))).toBe(
      '/images/main.png',
    );
    expect(groups.map((group) => group.title.zh)).toEqual(['产品图册']);
    expect(groups[0]?.images).toEqual([
      '/images/products/extracted/arc-flash-suit/image-001.png',
      '/images/products/extracted/arc-flash-suit/image-002.png',
    ]);
  });
});

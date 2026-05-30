import { describe, expect, it } from 'vitest';

import { productPrimaryImage, productVisualGroups } from '@/lib/content/productVisuals';
import type { Product } from '@/lib/product/types';

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
    image: '/media/firefighter-suit-combat-001.png',
    images: [
      '/media/firefighter-suit-combat-001.png',
      '/media/firefighter-suit-combat-002.png',
      '/media/firefighter-suit-combat-003.png',
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
  it('uses the backend primary image as the hero image', () => {
    expect(productPrimaryImage(product())).toBe('/media/firefighter-suit-combat-001.png');
  });

  it('builds the default gallery only from backend product images', () => {
    const groups = productVisualGroups(product());

    expect(groups.map((group) => group.title.zh)).toEqual(['产品图册']);
    expect(groups[0]?.images).toEqual([
      '/media/firefighter-suit-combat-001.png',
      '/media/firefighter-suit-combat-002.png',
      '/media/firefighter-suit-combat-003.png',
    ]);
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

  it('uses backend product images as the default gallery for products without visual groups', () => {
    const groups = productVisualGroups(
      product({
        id: 'arc-flash-suit',
        image: '/images/cms/arc-flash-suit/image-001.png',
        images: [
          '/images/cms/arc-flash-suit/image-001.png',
          '/images/cms/arc-flash-suit/image-002.png',
        ],
      }),
    );

    expect(productPrimaryImage(product({ id: 'arc-flash-suit', image: '/images/main.png' }))).toBe(
      '/images/main.png',
    );
    expect(groups.map((group) => group.title.zh)).toEqual(['产品图册']);
    expect(groups[0]?.images).toEqual([
      '/images/cms/arc-flash-suit/image-001.png',
      '/images/cms/arc-flash-suit/image-002.png',
    ]);
  });
});

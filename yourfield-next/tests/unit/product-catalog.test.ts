import { describe, expect, it } from 'vitest';

import {
  buildCatalogSlots,
  catalogGroupIds,
  catalogSlotNumber,
  countCatalogSlotsByGroup,
  resolveCatalogHashTarget,
  type CatalogCmsProduct,
} from '@/lib/content/productCatalog';

const text = (value: string) => ({ zh: value, en: value, ru: value });

function cmsProduct(overrides: Partial<CatalogCmsProduct> = {}): CatalogCmsProduct {
  return {
    id: 'arc-flash-suit',
    model: 'Arc-Rated PPE',
    categoryId: 'arc-flash',
    categoryName: text('防电弧服'),
    groupId: 'electrical-protection',
    name: text('防电弧服'),
    description: text('防电弧服详情'),
    image: '/images/product-silhouette.svg',
    standards: ['GB 8965.1-2020'],
    features: [text('电弧热风险防护')],
    ...overrides,
  };
}

describe('product catalog bridge', () => {
  it('generates the official 38 catalog slots with stable numbering', () => {
    const slots = buildCatalogSlots([]);

    expect(slots).toHaveLength(38);
    expect(slots.map((slot) => slot.number)).toEqual(
      Array.from({ length: 38 }, (_, index) => catalogSlotNumber(index + 1)),
    );
    expect(slots[0]?.slotId).toBe('firefighter-suit-combat');
    expect(slots[37]?.slotId).toBe('water-rescue-accessories-06');
  });

  it('keeps the public group counts', () => {
    const slots = buildCatalogSlots([]);
    const counts = countCatalogSlotsByGroup(slots);

    expect(catalogGroupIds).toEqual([
      'fire-rescue',
      'electrical-protection',
      'thermal-welding',
      'chemical-medical',
      'water-rescue',
    ]);
    expect(counts).toEqual({
      'chemical-medical': 7,
      'electrical-protection': 14,
      'fire-rescue': 5,
      'thermal-welding': 4,
      'water-rescue': 8,
    });
  });

  it('marks matched CMS products as published and missing slots as preparing', () => {
    const publishedProduct = cmsProduct({ productId: 'arc-flash-suit', slug: 'arc-rated-ppe' });
    const slots = buildCatalogSlots([publishedProduct]);
    const publishedSlot = slots.find((slot) => slot.slotId === 'arc-flash-suit');
    const preparingSlot = slots.find((slot) => slot.slotId === 'arc-flash-02');

    expect(publishedSlot?.status).toBe('published');
    expect(publishedSlot?.cmsProduct?.id).toBe('arc-flash-suit');
    expect(preparingSlot?.status).toBe('preparing');
    expect(preparingSlot?.cmsProduct).toBeNull();
  });

  it('matches CMS products by explicit productId before slug', () => {
    const slots = buildCatalogSlots([
      cmsProduct({
        id: 'seo-arc-flash-page',
        productId: 'arc-flash-suit',
        slug: 'seo-arc-flash-page',
      }),
    ]);
    const publishedSlot = slots.find((slot) => slot.slotId === 'arc-flash-suit');

    expect(publishedSlot?.status).toBe('published');
    expect(publishedSlot?.cmsProduct?.id).toBe('seo-arc-flash-page');
  });

  it('does not let a slug override a different explicit productId', () => {
    const slots = buildCatalogSlots([
      cmsProduct({
        id: 'shielding-slot-cms-record',
        productId: 'shielding-02',
        slug: 'arc-flash-suit',
      }),
    ]);
    const arcFlashSlot = slots.find((slot) => slot.slotId === 'arc-flash-suit');
    const shieldingSlot = slots.find((slot) => slot.slotId === 'shielding-02');

    expect(arcFlashSlot?.status).toBe('preparing');
    expect(shieldingSlot?.status).toBe('published');
    expect(shieldingSlot?.cmsProduct?.id).toBe('shielding-slot-cms-record');
  });

  it('uses safe visible assets when local CMS media is unavailable to Next', () => {
    const slots = buildCatalogSlots([
      cmsProduct({
        productId: 'arc-flash-suit',
        image: '/media/modeling-jacket-front-5-600x400.png',
      }),
      cmsProduct({
        id: 'shielding-missing-media',
        productId: 'shielding-02',
        image: '/media/missing-product-image.png',
      }),
    ]);
    const arcFlashSlot = slots.find((slot) => slot.slotId === 'arc-flash-suit');
    const shieldingSlot = slots.find((slot) => slot.slotId === 'shielding-02');

    expect(arcFlashSlot?.image).toBe(
      '/images/products/extracted/firefighter-suit-combat/image-001.png',
    );
    expect(shieldingSlot?.image).toBe('');
  });

  it('uses the standard template image for the firefighter combat listing card', () => {
    const slots = buildCatalogSlots([
      cmsProduct({
        id: 'firefighter-suit-combat',
        productId: 'firefighter-suit-combat',
        image: '/images/products/extracted/firefighter-suit-combat/image-001.png',
      }),
    ]);
    const firefighterSlot = slots.find((slot) => slot.slotId === 'firefighter-suit-combat');

    expect(firefighterSlot?.image).toBe(
      '/images/products/firefighter-protective-suit/modeling-jacket-front.png',
    );
  });

  it('maps group, category, and industry hashes to catalog targets', () => {
    expect(resolveCatalogHashTarget('electrical-protection')).toEqual({
      categoryIds: [],
      groupId: 'electrical-protection',
    });
    expect(resolveCatalogHashTarget('arc-flash')).toEqual({
      categoryIds: ['arc-flash'],
      groupId: 'electrical-protection',
    });
    expect(resolveCatalogHashTarget('industry-power')).toEqual({
      categoryIds: ['arc-flash', 'shielding', 'high-voltage-static'],
      groupId: 'electrical-protection',
    });
    expect(resolveCatalogHashTarget('industry-equipment')).toEqual({
      categoryIds: ['welding'],
      groupId: 'thermal-welding',
    });
    expect(resolveCatalogHashTarget('unknown')).toBeNull();
  });
});

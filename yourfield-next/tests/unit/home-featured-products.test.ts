import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Product } from '@/lib/mock/products';

const text = (value: string) => ({ zh: value, en: value, ru: value });

function product(overrides: Partial<Product>): Product {
  const id = overrides.id ?? 'product';
  const image = overrides.image ?? `/images/${id}.png`;

  return {
    applications: [],
    categoryId: overrides.categoryId ?? id,
    categoryName: overrides.categoryName ?? text('分类'),
    description: overrides.description ?? text('原描述'),
    faqs: [],
    features: overrides.features ?? [text('原特性')],
    groupId: overrides.groupId ?? 'fire-rescue',
    id,
    image,
    images: overrides.images ?? [image],
    materials: [],
    model: overrides.model ?? id,
    name: overrides.name ?? text(id),
    specifications: [],
    standards: overrides.standards ?? ['原标准'],
    ...overrides,
  };
}

describe('home featured products', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('uses cleaned representative copy and display images on the homepage', async () => {
    const products = [
      product({
        categoryName: text('消防员灭火防护服'),
        groupId: 'fire-rescue',
        id: 'firefighter-suit-combat',
      }),
      product({
        categoryName: text('防电弧服'),
        description: text('原始防电弧描述'),
        features: [text('原始防电弧特性')],
        groupId: 'electrical-protection',
        id: 'arc-flash-suit',
        image: '/images/products/extracted/arc-flash-suit/image-001.png',
        images: ['/images/products/extracted/arc-flash-suit/image-001.png'],
        name: text('1级防电弧服（夹克款）'),
        standards: ['原始标准'],
      }),
      product({
        categoryName: text('焊接服'),
        features: [text('阻燃'), text('配件还在完善中，会加入焊接眼镜')],
        groupId: 'thermal-welding',
        id: 'welding-protective-clothing',
      }),
      product({
        categoryName: text('防化服'),
        description: text('一次性化学防护服'),
        features: [text('原防化特性'), text('配套产品l 配套产品')],
        groupId: 'chemical-medical',
        id: 'chemical-protective-suit',
      }),
      product({
        categoryName: text('水域救援服'),
        groupId: 'water-rescue',
        id: 'gan-shi-shui-yu-jiu-yuan-fu',
        standards: ['/ 暂无标准'],
      }),
    ];

    vi.doMock('@/lib/cms/products', () => ({
      getCmsProductCategories: vi.fn(() => Promise.resolve([])),
      getCmsProductGroups: vi.fn(() => Promise.resolve([])),
      getCmsProducts: vi.fn(() => Promise.resolve([])),
      getFeaturedCmsProducts: vi.fn(() => Promise.resolve(products)),
    }));

    const { getHomeFeaturedProducts } = await import('@/lib/cms/home');
    const result = await getHomeFeaturedProducts('zh');
    const firefighter = result.find((item) => item.id === 'firefighter-suit-combat');
    const arcFlash = result.find((item) => item.id === 'arc-flash-suit');
    const welding = result.find((item) => item.id === 'welding-protective-clothing');
    const chemical = result.find((item) => item.id === 'chemical-protective-suit');
    const waterRescue = result.find((item) => item.id === 'gan-shi-shui-yu-jiu-yuan-fu');

    expect(result.map((item) => item.id)).toEqual([
      'firefighter-suit-combat',
      'arc-flash-suit',
      'welding-protective-clothing',
      'chemical-protective-suit',
      'gan-shi-shui-yu-jiu-yuan-fu',
    ]);
    expect(firefighter?.image).toBe(
      '/images/products/official/firefighter-suit-combat-combat-01.png',
    );
    expect(firefighter?.images[0]).toBe(
      '/images/products/official/firefighter-suit-combat-combat-01.png',
    );
    expect(arcFlash?.name.zh).toBe('防电弧服（夹克款）');
    expect(arcFlash?.image).toBe(
      '/images/products/official/arc-flash-suit-level-2-jacket-a-01.png',
    );
    expect(arcFlash?.images[0]).toBe(
      '/images/products/official/arc-flash-suit-level-2-jacket-a-01.png',
    );
    expect(welding?.image).toBe(
      '/images/products/official/welding-protective-clothing-class-b-split-01.png',
    );
    expect(welding?.images[0]).toBe(
      '/images/products/official/welding-protective-clothing-class-b-split-01.png',
    );
    expect(welding?.features.map((feature) => feature.zh).join(' ')).not.toContain('配件');
    expect(chemical?.image).toBe(
      '/images/products/official/chemical-protective-suit-disposable-chemical-a-01.png',
    );
    expect(chemical?.images[0]).toBe(
      '/images/products/official/chemical-protective-suit-disposable-chemical-a-01.png',
    );
    expect(chemical?.description.zh).toContain('粉尘');
    expect(chemical?.features.map((feature) => feature.zh).join(' ')).not.toContain('配套产品');
    expect(waterRescue?.standards).toEqual([]);
  });

  it('falls back to extracted homepage products when the CMS product query fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    vi.doMock('@/lib/cms/products', () => ({
      getCmsProductCategories: vi.fn(() => Promise.reject(new Error('schema drift'))),
      getCmsProductGroups: vi.fn(() => Promise.reject(new Error('schema drift'))),
      getCmsProducts: vi.fn(() => Promise.reject(new Error('schema drift'))),
      getFeaturedCmsProducts: vi.fn(() => Promise.reject(new Error('schema drift'))),
    }));

    const { getHomeFeaturedProducts, getHomeProductSearchStats } = await import('@/lib/cms/home');
    const result = await getHomeFeaturedProducts('zh');
    const stats = await getHomeProductSearchStats('zh');

    expect(result.map((item) => item.id)).toEqual([
      'firefighter-suit-combat',
      'arc-flash-suit',
      'welding-protective-clothing',
      'chemical-protective-suit',
      'gan-shi-shui-yu-jiu-yuan-fu',
    ]);
    expect(result.find((item) => item.id === 'arc-flash-suit')?.image).toBe(
      '/images/products/official/arc-flash-suit-level-2-jacket-a-01.png',
    );
    expect(stats).toEqual({ catalogCount: 38, groupCount: 5 });
    expect(warn).toHaveBeenCalledWith(
      '[home] failed to load CMS featured products; using extracted products',
      expect.any(Object),
    );
    expect(warn).toHaveBeenCalledWith(
      '[home] failed to load CMS product stats; using fallback catalog stats',
      expect.any(Object),
    );
  });
});

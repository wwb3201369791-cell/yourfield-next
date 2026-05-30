import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Product } from '@/lib/product/types';

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

  it('uses the first product from the first five CMS product groups without homepage overrides', async () => {
    const products = [
      product({
        categoryName: text('水域救援服'),
        groupId: 'water-rescue',
        id: 'water-rescue-first',
        name: text('后台水域救援第一款'),
      }),
      product({
        categoryName: text('水域救援服'),
        groupId: 'water-rescue',
        id: 'water-rescue-second',
        name: text('后台水域救援第二款'),
      }),
      product({
        categoryName: text('定制防护'),
        groupId: 'custom-protection',
        id: 'custom-protection-first',
        name: text('后台定制防护第一款'),
      }),
      product({
        categoryName: text('消防员灭火防护服'),
        groupId: 'fire-rescue',
        id: 'firefighter-suit-combat',
        name: text('后台消防第一款'),
      }),
      product({
        categoryName: text('防电弧服'),
        description: text('后台防电弧描述'),
        features: [text('后台防电弧特性')],
        groupId: 'electrical-protection',
        id: 'arc-flash-suit',
        image: '/images/cms/arc-flash-suit.png',
        images: ['/images/cms/arc-flash-suit.png'],
        name: text('后台防电弧第一款'),
        standards: ['后台标准'],
      }),
      product({
        categoryName: text('焊接服'),
        groupId: 'thermal-welding',
        id: 'welding-protective-clothing',
        name: text('后台焊接第一款'),
      }),
      product({
        categoryName: text('防化服'),
        groupId: 'chemical-medical',
        id: 'chemical-protective-suit',
        name: text('后台防化第一款'),
      }),
    ];

    vi.doMock('@/lib/cms/products', () => ({
      getCmsProductCategories: vi.fn(() => Promise.resolve([])),
      getCmsProductGroups: vi.fn(() =>
        Promise.resolve([
          { categoryIds: [], id: 'water-rescue', order: 1, title: '水域救援' },
          { categoryIds: [], id: 'custom-protection', order: 2, title: '定制防护' },
          { categoryIds: [], id: 'fire-rescue', order: 3, title: '消防救援' },
          { categoryIds: [], id: 'electrical-protection', order: 4, title: '电力防护' },
          { categoryIds: [], id: 'thermal-welding', order: 5, title: '热工焊接' },
          { categoryIds: [], id: 'chemical-medical', order: 6, title: '化学医疗' },
        ]),
      ),
      getCmsProducts: vi.fn(() => Promise.resolve(products)),
    }));

    const { getHomeFeaturedProducts } = await import('@/lib/cms/home');
    const result = await getHomeFeaturedProducts('zh');
    const firefighter = result.find((item) => item.id === 'firefighter-suit-combat');
    const arcFlash = result.find((item) => item.id === 'arc-flash-suit');
    const welding = result.find((item) => item.id === 'welding-protective-clothing');
    const chemical = result.find((item) => item.id === 'chemical-protective-suit');
    const waterRescue = result.find((item) => item.id === 'water-rescue-first');

    expect(result.map((item) => item.id)).toEqual([
      'water-rescue-first',
      'custom-protection-first',
      'firefighter-suit-combat',
      'arc-flash-suit',
      'welding-protective-clothing',
    ]);
    expect(result.some((item) => item.id === 'water-rescue-second')).toBe(false);
    expect(result.some((item) => item.id === 'chemical-protective-suit')).toBe(false);
    expect(firefighter?.name.zh).toBe('后台消防第一款');
    expect(arcFlash?.name.zh).toBe('后台防电弧第一款');
    expect(arcFlash?.description.zh).toBe('后台防电弧描述');
    expect(arcFlash?.image).toBe('/images/cms/arc-flash-suit.png');
    expect(arcFlash?.standards).toEqual(['后台标准']);
    expect(welding?.name.zh).toBe('后台焊接第一款');
    expect(chemical).toBeUndefined();
    expect(waterRescue?.id).toBe('water-rescue-first');
  });

  it('hides non-localized CMS products on English and Russian home previews', async () => {
    const products = [
      product({
        categoryName: { en: 'Electrical protection', ru: 'Электрозащита', zh: '电力防护' },
        description: {
          en: 'Certified arc flash protection for electrical crews.',
          ru: 'Сертифицированная защита от дуги для электротехнических бригад.',
          zh: '电力电网中文介绍',
        },
        groupId: 'electrical-protection',
        id: 'arc-flash-localized',
        name: {
          en: 'Arc flash shirt suit',
          ru: 'Костюм от дугового разряда',
          zh: '防电弧服中文名',
        },
      }),
      product({
        description: {
          en: '电力电网、光伏、新能源及工业企业变电站等可能遭受电弧伤害的电气作业场景。',
          ru: '',
          zh: '电力电网中文介绍',
        },
        groupId: 'fire-rescue',
        id: 'official-yftg-fs24526',
        name: { en: '1级防电弧服（衬衫款）', ru: '', zh: '1级防电弧服（衬衫款）' },
      }),
      product({
        description: { en: 'Internal import slug awaiting translation.', ru: '', zh: '待翻译' },
        groupId: 'water-rescue',
        id: 'official-hyf-3537',
        name: { en: 'official-hyf-3537', ru: '', zh: '牛尾绳' },
      }),
    ];

    vi.doMock('@/lib/cms/products', () => ({
      getCmsProductCategories: vi.fn(() => Promise.resolve([])),
      getCmsProductGroups: vi.fn(() =>
        Promise.resolve([
          {
            categoryIds: [],
            id: 'electrical-protection',
            order: 1,
            title: 'Electrical protection',
          },
          { categoryIds: [], id: 'fire-rescue', order: 2, title: 'Fire rescue' },
          { categoryIds: [], id: 'water-rescue', order: 3, title: 'Water rescue' },
        ]),
      ),
      getCmsProducts: vi.fn(() => Promise.resolve(products)),
    }));

    const { getHomeFeaturedProducts } = await import('@/lib/cms/home');
    const englishResult = await getHomeFeaturedProducts('en');
    const russianResult = await getHomeFeaturedProducts('ru');

    expect(englishResult.map((item) => item.id)).toEqual(['arc-flash-localized']);
    expect(russianResult.map((item) => item.id)).toEqual(['arc-flash-localized']);
  });

  it('propagates CMS product query errors instead of returning silent empty fallbacks', async () => {
    vi.doMock('@/lib/cms/products', () => ({
      getCmsProductCategories: vi.fn(() => Promise.reject(new Error('schema drift'))),
      getCmsProductGroups: vi.fn(() => Promise.reject(new Error('schema drift'))),
      getCmsProducts: vi.fn(() => Promise.reject(new Error('schema drift'))),
    }));

    const { getHomeFeaturedProducts, getHomeProductSearchStats } = await import('@/lib/cms/home');

    await expect(getHomeFeaturedProducts('zh')).rejects.toThrow('schema drift');
    await expect(getHomeProductSearchStats('zh')).rejects.toThrow('schema drift');
  });
});

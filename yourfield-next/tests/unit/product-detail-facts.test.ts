import { describe, expect, it } from 'vitest';

import { buildProductDetailFacts } from '@/lib/content/productDetail';
import type { Product } from '@/lib/mock/products';

const text = (value: string) => ({ en: value, ru: value, zh: value });

const labels = {
  category: '类别',
  color: '颜色',
  materials: '材料',
  model: '型号',
  sizeRange: '尺码',
  standard: '执行标准',
  structure: '结构',
};

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
    image: '',
    images: [],
    materials: [text('三层芳纶复合结构')],
    model: 'HYF-5506',
    name: text('消防员灭火防护服（作战款）'),
    specifications: [
      { label: text('颜色'), value: text('藏蓝色') },
      { label: text('结构'), value: text('三层芳纶复合结构') },
      { label: text('备注'), value: text('支持按需定制') },
    ],
    standards: ['XF10-2014'],
    ...overrides,
  };
}

describe('product detail facts', () => {
  it('builds the legacy first-screen table and removes duplicated specification rows', () => {
    const result = buildProductDetailFacts(
      product({
        sizeRange: ['165A-190B'],
      }),
      'zh',
      labels,
    );

    expect(result.facts).toEqual([
      { label: '型号', value: 'HYF-5506' },
      { label: '执行标准', value: 'XF10-2014' },
      { label: '颜色', value: '藏蓝色' },
      { label: '尺码', value: '165A-190B' },
      { label: '材料', value: '三层芳纶复合结构' },
      { label: '类别', value: '消防员灭火防护服' },
      { label: '结构', value: '三层芳纶复合结构' },
    ]);
    expect(result.additionalSpecifications).toEqual([
      { label: '备注', value: '支持按需定制' },
    ]);
  });

  it('omits empty facts and can use flexible specification labels when dedicated fields are blank', () => {
    const result = buildProductDetailFacts(
      product({
        categoryName: text(''),
        materials: [],
        model: '',
        sizeRange: [],
        specifications: [
          { label: text('货号'), value: text('HYF-5506') },
          { label: text('颜色'), value: text('') },
          { label: text('尺码'), value: text('') },
        ],
        standards: [],
      }),
      'zh',
      labels,
    );

    expect(result.facts).toEqual([{ label: '型号', value: 'HYF-5506' }]);
    expect(result.additionalSpecifications).toEqual([]);
  });
});

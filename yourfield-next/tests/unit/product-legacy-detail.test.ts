import { describe, expect, it } from 'vitest';

import { getExtractedProductById } from '@/lib/content/extractedProducts';
import { applyLegacyProductDetailFallback } from '@/lib/content/productLegacyDetails';
import { localized } from '@/lib/mock/products';

describe('legacy product detail template data', () => {
  it('keeps the firefighter combat suit aligned with the old detail layout', () => {
    const product = getExtractedProductById('firefighter-suit-combat');

    expect(product?.model).toBe('HYF-5506');
    expect(product?.standards).toEqual(['XF10-2014']);
    expect(product?.sellingPoints).toHaveLength(4);
    expect(product?.sizeGuide?.columns).toEqual([
      '50-55',
      '55-65',
      '65-75',
      '75-85',
      '80-90',
      '90-100',
      '100-110',
    ]);
    expect(product?.qualityEvidence).toHaveLength(2);
    expect(product?.careInstructions).toHaveLength(4);
    expect(product?.faqs).toHaveLength(2);
    expect(product?.scenarios?.map((scenario) => localized(scenario.title, 'zh'))).toEqual([
      '灭火救援',
      '应急抢险',
      '灾害处置',
    ]);
  });

  it('fills missing CMS detail blocks from the legacy firefighter template', () => {
    const product = applyLegacyProductDetailFallback({
      applications: [],
      categoryId: 'firefighter-suit',
      categoryName: { en: '消防员灭火防护服', ru: '消防员灭火防护服', zh: '消防员灭火防护服' },
      description: { en: '', ru: '', zh: '' },
      faqs: [],
      features: [],
      groupId: 'fire-rescue',
      id: 'firefighter-suit-combat',
      image: '',
      images: [],
      materials: [],
      model: 'HYF-5506',
      name: { en: '消防员灭火防护服（作战款）', ru: '消防员灭火防护服（作战款）', zh: '消防员灭火防护服（作战款）' },
      specifications: [],
      standards: [],
    });

    expect(product.qualityEvidence).toHaveLength(2);
    expect(product.careInstructions).toHaveLength(4);
    expect(product.faqs).toHaveLength(2);
    expect(product.scenarios?.map((scenario) => localized(scenario.title, 'zh'))).toEqual([
      '灭火救援',
      '应急抢险',
      '灾害处置',
    ]);
    expect(product.sizeGuide?.columns).toEqual([
      '50-55',
      '55-65',
      '65-75',
      '75-85',
      '80-90',
      '90-100',
      '100-110',
    ]);
  });

  it('keeps CMS scenario cards ahead of the legacy firefighter fallback', () => {
    const product = applyLegacyProductDetailFallback({
      applications: [],
      categoryId: 'firefighter-suit',
      categoryName: { en: '消防员灭火防护服', ru: '消防员灭火防护服', zh: '消防员灭火防护服' },
      description: { en: '', ru: '', zh: '' },
      faqs: [],
      features: [],
      groupId: 'fire-rescue',
      id: 'firefighter-suit-combat',
      image: '',
      images: [],
      materials: [],
      model: 'HYF-5506',
      name: { en: '消防员灭火防护服（作战款）', ru: '消防员灭火防护服（作战款）', zh: '消防员灭火防护服（作战款）' },
      scenarios: [
        {
          text: { en: 'CMS text', ru: 'CMS text', zh: '后台自定义说明' },
          title: { en: 'CMS scenario', ru: 'CMS scenario', zh: '后台自定义场景' },
        },
      ],
      specifications: [],
      standards: [],
    });

    expect(product.scenarios?.map((scenario) => localized(scenario.title, 'zh'))).toEqual([
      '后台自定义场景',
    ]);
  });
});

import { describe, expect, it } from 'vitest';

import { productSeoKeywords } from '@/lib/product/seoKeywords';
import type { Product } from '@/lib/product/types';

const text = (zh: string, en = zh, ru = en) => ({ zh, en, ru });

function product(overrides: Partial<Product> = {}): Product {
  return {
    applications: [],
    categoryId: 'thermal-welding',
    categoryName: text('工业热防护与阻燃工装', 'Industrial Thermal & Flame-Resistant Workwear'),
    description: text(
      'A级阻燃服用于工业热防护场景。',
      'Class A flame-resistant suit for industrial thermal protection.',
    ),
    faqs: [],
    features: [],
    groupId: 'thermal-welding',
    id: 'official-hyf-3105',
    image: '',
    images: [],
    materials: [],
    model: 'HYF-3105',
    name: text('A级阻燃服', 'Class A Flame-Resistant Suit'),
    qualityEvidence: [],
    scenarios: [],
    sellingPoints: [],
    specifications: [],
    standards: ['GB8965.1-2020《防护服装阻燃服》'],
    visualGroups: [],
    ...overrides,
  };
}

describe('product SEO keyword generation', () => {
  it('builds localized procurement terms for currently listed products', () => {
    const terms = productSeoKeywords(product(), 'zh');

    expect(terms).toEqual(expect.arrayContaining(['A级阻燃服', 'A级阻燃服厂家', '阻燃连体服厂家']));
    expect(terms).toContain('阻燃防护服厂家');
  });

  it('keeps English and Russian keyword sets free from Chinese-only standard labels', () => {
    const enTerms = productSeoKeywords(product(), 'en').join(' ');
    const ruTerms = productSeoKeywords(product(), 'ru').join(' ');

    expect(enTerms).toContain('Flame Resistant Clothing Manufacturer');
    expect(enTerms).toContain('GB8965.1-2020');
    expect(enTerms).not.toMatch(/[\u3400-\u9fff]/u);
    expect(ruTerms).toContain('производитель огнестойкой одежды');
    expect(ruTerms).not.toMatch(/[\u3400-\u9fff]/u);
  });

  it('uses the product group to select search terms for other listed product families', () => {
    expect(productSeoKeywords(product({ groupId: 'electrical-protection' }), 'en')).toContain(
      'Arc Flash Clothing Manufacturer',
    );
    expect(productSeoKeywords(product({ groupId: 'fire-rescue' }), 'zh')).toContain(
      '消防员灭火防护服厂家',
    );
    expect(productSeoKeywords(product({ groupId: 'chemical-medical' }), 'zh')).toContain(
      '化学防护服厂家',
    );
    expect(productSeoKeywords(product({ groupId: 'water-rescue' }), 'en')).toContain(
      'Dry Water Rescue Suit',
    );
  });

  it('does not add thermal procurement keywords from incidental flame-retardant material copy', () => {
    const terms = productSeoKeywords(
      product({
        applications: [text('电力电网带电作业中心')],
        categoryId: '',
        categoryName: text(''),
        description: text('进入高电场的工作人员应穿全套屏蔽服。'),
        features: [text('辅料均采用阻燃材料，安全性能更优异。')],
        groupId: '',
        id: 'live-line-shielding-suit',
        materials: [text('本质阻燃/金属纤维混纺面料')],
        model: 'HYF-3703',
        name: text('1000kv带电作业用屏蔽服'),
        standards: ['GB/T6568-2008《带电作业用屏蔽服装》'],
      }),
      'zh',
    );

    expect(terms).toContain('防电弧服厂家');
    expect(terms).not.toContain('阻燃连体服厂家');
  });
});

import { describe, expect, it } from 'vitest';

import { faqPageJsonLd, productJsonLd } from '@/lib/seo/jsonld';
import type { Product } from '@/lib/product/types';

const localizedText = (value: string) => ({ zh: value, en: value, ru: value });
const mixedLocalizedText = (zh: string, en = zh, ru = zh) => ({ zh, en, ru });

const product: Product = {
  applications: [],
  careInstructions: [],
  categoryId: 'water-rescue',
  categoryName: mixedLocalizedText('水域救援防护', 'Water Rescue Protection'),
  description: mixedLocalizedText('中文详情摘要', 'Translated water rescue summary.'),
  faqs: [
    {
      question: localizedText('如何清洗？'),
      answer: localizedText('按说明清洗。'),
    },
    {
      question: mixedLocalizedText('保修多久？', 'How long is the warranty?'),
      answer: mixedLocalizedText('一年。', 'One year.'),
    },
  ],
  features: [],
  groupId: 'water-rescue',
  id: 'dry-water-rescue-suit-hyf-9905',
  image: '/images/product.png',
  images: ['/images/product.png'],
  materials: [],
  model: 'HYF-9905',
  name: mixedLocalizedText('干式水域救援服', 'Dry Water Rescue Suit'),
  qualityEvidence: [],
  scenarios: [],
  sellingPoints: [],
  specifications: [
    { label: localizedText('颜色'), value: localizedText('红色') },
    { label: mixedLocalizedText('型号', 'Model'), value: 'HYF-9905' },
  ],
  standards: [],
  visualGroups: [],
};

describe('product public JSON-LD localization', () => {
  it('filters Chinese-only product fields from English structured data', () => {
    const data = productJsonLd(product, 'en');
    const text = JSON.stringify(data);

    expect(data).toMatchObject({
      '@type': 'Product',
      name: 'Dry Water Rescue Suit',
      category: 'Water Rescue Protection',
      description: 'Translated water rescue summary.',
      additionalProperty: [{ '@type': 'PropertyValue', name: 'Model', value: 'HYF-9905' }],
    });
    expect(text).not.toMatch(/[\u3400-\u9fff]/u);
  });

  it('filters Chinese-only FAQ rows from English structured data', () => {
    const data = faqPageJsonLd(product.faqs, 'en', '/en/products/dry-water-rescue-suit-hyf-9905');
    const text = JSON.stringify(data);

    expect(data.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'How long is the warranty?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'One year.',
        },
      },
    ]);
    expect(text).not.toMatch(/[\u3400-\u9fff]/u);
  });
});

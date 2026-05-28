import { describe, expect, it } from 'vitest';

import { recommendedProductHitsFromSources, toCandidates } from '../search-candidates';
import type { SearchSources } from '../types';

function emptySources(overrides: Partial<SearchSources> = {}): SearchSources {
  return {
    faqs: [],
    industryCases: [],
    news: [],
    pages: [],
    products: [],
    solutions: [],
    ...overrides,
  };
}

const richText = (text: string) => ({
  root: {
    children: [{ text }],
  },
});

describe('search candidates', () => {
  it('maps product documents into weighted candidates with category keys and card images', () => {
    const [product] = toCandidates(
      emptySources({
        products: [
          {
            id: 'p1',
            name: '消防员灭火防护服',
            productId: 'HYF-5506',
            slug: 'firefighter-suit',
            model: 'HYF 5506',
            sku: 'SKU-5506',
            description: richText('阻燃隔热，适用于消防救援'),
            category: {
              categoryId: 'firefighter-suit',
              slug: 'firefighter',
              group: 'ppe',
              name: '消防员灭火防护服',
            },
            tags: ['消防', { label: '阻燃' }],
            images: [
              {
                file: {
                  url: '/uploads/original.jpg',
                  sizes: { card: { url: '/uploads/card.jpg' } },
                },
              },
            ],
          },
        ],
      }),
      'zh',
    );

    expect(product).toMatchObject({
      category: { id: 'firefighter-suit', name: '消防员灭火防护服' },
      image: '/uploads/card.jpg',
      productId: 'HYF-5506',
      slug: 'firefighter-suit',
      title: '消防员灭火防护服',
      type: 'product',
      url: '/zh/products/firefighter-suit',
    });
    expect(product?.categoryKeys).toEqual([
      'firefighter-suit',
      'firefighter',
      'ppe',
      '消防员灭火防护服',
    ]);
    expect(product?.fields.some((field) => field.text.includes('阻燃隔热'))).toBe(true);
  });

  it('maps all supported source groups into localized URLs', () => {
    const candidates = toCandidates(
      emptySources({
        faqs: [{ id: 'faq1', question: '如何清洗？', answer: richText('低温清洗') }],
        industryCases: [{ id: 'case1', title: '石化行业', text: '防化场景', anchor: 'chemical' }],
        news: [{ id: 'n1', slug: 'launch', title: '新品发布', excerpt: '新闻摘要' }],
        pages: [{ id: 'page1', pageKey: 'about', title: '关于我们', hero: { title: '永霏' } }],
        products: [{ id: 'p1', name: '产品', slug: 'product-one' }],
        solutions: [{ id: 's1', slug: 'forest-fire', title: '森林消防方案', summary: '方案摘要' }],
      }),
      'zh',
    );

    expect(candidates.map((candidate) => candidate.type).sort()).toEqual([
      'faq',
      'industry-case',
      'news',
      'page',
      'product',
      'solution',
    ]);
    expect(candidates.map((candidate) => candidate.url)).toEqual(
      expect.arrayContaining([
        '/zh',
        '/zh/news/launch',
        '/zh/products/product-one',
        '/zh/products#chemical',
        '/zh/solutions#forest-fire',
        '/zh/about',
      ]),
    );
  });

  it('builds deterministic recommended product hits and honors limits', () => {
    const hits = recommendedProductHitsFromSources(
      {
        products: [
          { id: 'b', name: 'B 产品', slug: 'b-product', category: { categoryId: 'b', name: 'B 类' } },
          { id: 'a', name: 'A 产品', slug: 'a-product', category: { categoryId: 'a', name: 'A 类' } },
        ],
      },
      'zh',
      1,
    );

    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      category: { id: 'a', name: 'A 类' },
      score: 0,
      title: 'A 产品',
      type: 'product',
      url: '/zh/products/a-product',
    });
  });
});

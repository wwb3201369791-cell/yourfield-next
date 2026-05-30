import { describe, expect, it } from 'vitest';

import { directSearchHitFor, safeDirectSearchHref } from '@/lib/search/direct';
import type { SearchHit } from '@/lib/search/types';

const hits: SearchHit[] = [
  {
    excerpt: '消防员抢险救援服夏款',
    id: 'product:rescue-suit-summer',
    model: 'HYF-5221',
    score: 300,
    sku: 'HYF-5221',
    title: '消防员抢险救援服（夏款）',
    type: 'product',
    url: '/zh/products/rescue-suit-summer',
  },
  {
    excerpt: '消防救援防护产品',
    id: 'product:rescue-suit-winter',
    model: 'HYF-5222',
    score: 120,
    sku: 'HYF-5222',
    title: '消防员抢险救援服（冬款）',
    type: 'product',
    url: '/zh/products/rescue-suit-winter',
  },
];

describe('direct search hit resolution', () => {
  it('returns the matching result for exact product title, model, or SKU searches', () => {
    expect(directSearchHitFor('消防员抢险救援服（夏款）', hits)?.url).toBe(
      '/zh/products/rescue-suit-summer',
    );
    expect(directSearchHitFor('HYF-5221', hits)?.url).toBe('/zh/products/rescue-suit-summer');
    expect(directSearchHitFor(' hyf-5221 ', hits)?.url).toBe('/zh/products/rescue-suit-summer');
  });

  it('keeps broad terms on the search results page', () => {
    expect(directSearchHitFor('消防员抢险救援服', hits)).toBeNull();
    expect(directSearchHitFor('消防', hits)).toBeNull();
  });

  it('only allows internal direct navigation URLs', () => {
    const firstHit = hits[0] as SearchHit;

    expect(safeDirectSearchHref(firstHit)).toBe('/zh/products/rescue-suit-summer');
    expect(
      safeDirectSearchHref({
        ...firstHit,
        url: 'https://example.com/products/rescue-suit-summer',
      }),
    ).toBeNull();
  });
});

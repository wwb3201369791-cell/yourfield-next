import { describe, expect, it } from 'vitest';

import { parseSearchParams, parseSearchSuggestParams } from '@/lib/search/params';
import {
  recommendedProductHitsFromSources,
  searchContent,
  suggestContent,
} from '@/lib/search/search';
import type { SearchSourceProvider } from '@/lib/search/types';

const product = {
  category: {
    categoryId: 'firefighter',
    group: 'fire-rescue',
    name: '消防防护',
    slug: 'firefighter',
  },
  description: {
    root: {
      children: [{ children: [{ text: '消防员灭火防护服，阻燃隔热。' }], type: 'paragraph' }],
    },
  },
  id: 'product-db-1',
  model: 'HYF-5506',
  name: '消防员灭火防护服',
  productId: 'firefighter-suit-combat',
  sku: 'HYF-5506',
  slug: 'firefighter-suit-combat',
  tags: [{ value: '消防' }, { value: '阻燃' }],
};

const news = {
  category: 'news',
  content: {
    root: {
      children: [{ children: [{ text: '永霏参加国际安全防护展。' }], type: 'paragraph' }],
    },
  },
  excerpt: '国际安全防护展动态',
  id: 'news-db-1',
  publishedAt: '2026-05-01T00:00:00.000Z',
  slug: 'safety-expo',
  title: '永霏参加安全防护展',
};

const solution = {
  features: [{ value: '面向倒闸、巡检和检修团队的防电弧防护' }],
  id: 'solution-db-1',
  productTags: [{ value: '防电弧服' }, { value: '带电作业' }],
  slug: 'power-energy',
  solutionId: 'power-energy',
  summary: '面向发电、输电、配电、变电检修和带电作业配置防护装备。',
  title: '电力与能源',
};

const industryCase = {
  anchor: 'industry-power',
  id: 'case-power',
  image: '/images/solutions/solution-power-grid.jpg',
  meta: '电气防护',
  text: '围绕倒闸、巡检、变电检修和线路维护配置防电弧服、带电屏蔽服、绝缘手套等电气防护装备。',
  title: '电力电网作业',
};

const sourceProvider: SearchSourceProvider = () =>
  Promise.resolve({
    faqs: [],
    industryCases: [industryCase],
    news: [news],
    pages: [],
    products: [product],
    solutions: [solution],
  });

describe('parseSearchParams', () => {
  it('normalizes defaults and trims the query', () => {
    const parsed = parseSearchParams(new URLSearchParams({ q: '  HYF-5506  ' }));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value).toMatchObject({
      hitsPerPage: 10,
      locale: 'zh',
      page: 1,
      q: 'HYF-5506',
      type: 'all',
    });
    expect(parsed.value).not.toHaveProperty('category');
  });

  it('rejects invalid locale, type, category, and pagination values', () => {
    const parsed = parseSearchParams(
      new URLSearchParams({
        category: '../firefighter',
        hitsPerPage: '100',
        locale: 'de',
        page: '0',
        q: '消防',
        type: 'download',
      }),
    );

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;

    expect(Object.keys(parsed.error.fields).sort()).toEqual([
      'category',
      'hitsPerPage',
      'locale',
      'page',
      'type',
    ]);
  });
});

describe('parseSearchSuggestParams', () => {
  it('normalizes suggest defaults and enforces the limit range', () => {
    const parsed = parseSearchSuggestParams(
      new URLSearchParams({ limit: '5', locale: 'zh', q: '  消防   防护  ' }),
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value).toEqual({
      limit: 5,
      locale: 'zh',
      q: '消防 防护',
    });
  });

  it('rejects invalid suggestion locale and limit values', () => {
    const parsed = parseSearchSuggestParams(
      new URLSearchParams({ limit: '99', locale: 'de', q: '消防' }),
    );

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;

    expect(Object.keys(parsed.error.fields).sort()).toEqual(['limit', 'locale']);
  });
});

describe('searchContent', () => {
  it('returns an empty 200-safe response for an empty query without loading sources', async () => {
    const response = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'zh',
        page: 1,
        q: '',
        type: 'all',
      },
      () => {
        throw new Error('sources should not be loaded for empty query');
      },
    );

    expect(response).toMatchObject({
      empty: { reason: 'EMPTY_QUERY' },
      hits: [],
      ok: true,
      totalHits: 0,
    });
  });

  it('scores product identifiers highly and returns stable product fields', async () => {
    const response = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'zh',
        page: 1,
        q: 'HYF-5506',
        type: 'all',
      },
      sourceProvider,
    );

    expect(response.hits[0]).toMatchObject({
      productId: 'firefighter-suit-combat',
      title: '消防员灭火防护服',
      type: 'product',
      url: '/zh/products/firefighter-suit-combat',
    });
  });

  it('searches dynamic solutions as first-class public content', async () => {
    const response = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'zh',
        page: 1,
        q: '输电',
        type: 'all',
      },
      sourceProvider,
    );

    expect(response.hits[0]).toMatchObject({
      excerpt: '面向发电、输电、配电、变电检修和带电作业配置防护装备。',
      id: 'solution:solution-db-1',
      title: '电力与能源',
      type: 'solution',
      url: '/zh/solutions#power-energy',
    });
    expect(response.facets.types.solution).toBe(1);
  });

  it('searches static industry cases without requiring a Payload collection', async () => {
    const response = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'zh',
        page: 1,
        q: '电力电网作业',
        type: 'all',
      },
      sourceProvider,
    );

    expect(response.hits[0]).toMatchObject({
      id: 'industry-case:case-power',
      title: '电力电网作业',
      type: 'industry-case',
      url: '/zh/products#industry-power',
    });
    expect(response.hits[0]?.image).toBe('/images/solutions/solution-power-grid.jpg');
    expect(response.facets.types['industry-case']).toBe(1);
  });

  it('applies type and category filters before pagination', async () => {
    const response = await searchContent(
      {
        category: 'firefighter',
        hitsPerPage: 1,
        locale: 'zh',
        page: 1,
        q: '防护',
        type: 'product',
      },
      sourceProvider,
    );

    expect(response.hits).toHaveLength(1);
    expect(response.totalHits).toBe(1);
    expect(response.facets.types).toMatchObject({ product: 1 });
  });

  it('keeps full content type facets when a type filter is active', async () => {
    const response = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'zh',
        page: 1,
        q: '防护',
        type: 'product',
      },
      sourceProvider,
    );

    expect(response.hits).toHaveLength(1);
    expect(response.totalHits).toBe(1);
    expect(response.facets.types).toMatchObject({
      'industry-case': 1,
      product: 1,
      solution: 1,
    });
  });

  it('builds category facets only from product hits even when non-products match', async () => {
    const response = await searchContent(
      {
        hitsPerPage: 1,
        locale: 'zh',
        page: 1,
        q: '防护',
        type: 'all',
      },
      sourceProvider,
    );

    expect(response.facets.categories).toEqual({
      firefighter: 1,
    });
    expect(response.facets.categoryLabels).toEqual({
      firefighter: '消防防护',
    });
    expect(response.facets.types).toMatchObject({
      'industry-case': 1,
      product: 1,
      solution: 1,
    });
  });

  it('clamps out-of-range pages to the last available result page', async () => {
    const response = await searchContent(
      {
        hitsPerPage: 1,
        locale: 'zh',
        page: 99,
        q: '防护',
        type: 'all',
      },
      sourceProvider,
    );

    expect(response.empty).toBeUndefined();
    expect(response.hits).toHaveLength(1);
    expect(response.pagination).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: true,
      page: 4,
      totalPages: 4,
    });
    expect(response.totalHits).toBe(4);
  });

  it('adds recommended products to no-result responses without changing result hits', async () => {
    const response = await searchContent(
      {
        hitsPerPage: 10,
        locale: 'zh',
        page: 1,
        q: '不存在的型号',
        type: 'all',
      },
      sourceProvider,
      async (input) =>
        recommendedProductHitsFromSources(await sourceProvider(input), input.locale, 3),
    );

    expect(response).toMatchObject({
      empty: { reason: 'NO_RESULTS' },
      hits: [],
      ok: true,
      totalHits: 0,
    });
    expect(response.recommendations?.products).toEqual([
      expect.objectContaining({
        productId: 'firefighter-suit-combat',
        title: '消防员灭火防护服',
        type: 'product',
        url: '/zh/products/firefighter-suit-combat',
      }),
    ]);
  });
});

describe('suggestContent', () => {
  it('returns deduped content suggestions for matching public content', async () => {
    const response = await suggestContent(
      {
        limit: 5,
        locale: 'zh',
        q: '消',
      },
      sourceProvider,
    );

    expect(response).toMatchObject({
      locale: 'zh',
      ok: true,
      query: '消',
    });
    expect(response.suggestions[0]).toMatchObject({
      term: '消防员灭火防护服',
      type: 'product',
      url: '/zh/products/firefighter-suit-combat',
    });
  });

  it('returns no suggestions for blank queries without loading sources', async () => {
    const response = await suggestContent(
      {
        limit: 5,
        locale: 'zh',
        q: '',
      },
      () => {
        throw new Error('sources should not be loaded for empty suggestions');
      },
    );

    expect(response.suggestions).toEqual([]);
  });
});

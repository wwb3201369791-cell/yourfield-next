import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SearchQuery } from '@/lib/search/types';

type PayloadFindArgs = {
  collection: string;
  locale?: string;
  pagination?: boolean;
  where?: unknown;
};

const input = {
  hitsPerPage: 10,
  locale: 'zh',
  page: 1,
  q: '消防',
  type: 'product',
} satisfies SearchQuery;

const createPayloadStub = () => ({
  find: vi.fn((_args: PayloadFindArgs) => Promise.resolve({ docs: [] })),
});

afterEach(() => {
  vi.doUnmock('@/lib/cms/payload');
  vi.doUnmock('next/cache');
  vi.resetModules();
});

describe('getPayloadSearchSources', () => {
  it('loads all public search sources so filtered searches can keep complete facets', async () => {
    const payload = createPayloadStub();
    const unstableCache = vi.fn((fn: unknown) => fn);

    vi.resetModules();
    vi.doMock('next/cache', () => ({
      unstable_cache: unstableCache,
    }));
    vi.doMock('@/lib/cms/payload', () => ({
      getPayloadClient: vi.fn(() => Promise.resolve(payload)),
    }));
    const { getPayloadSearchSources } = await import('@/lib/search/payload');

    await getPayloadSearchSources(input);

    expect(unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ['payload-search-products'],
      expect.objectContaining({
        tags: ['cms:collection:products'],
      }),
    );
    expect(payload.find).toHaveBeenCalledTimes(5);
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        locale: 'zh',
        pagination: false,
        where: {
          and: [
            { _status: { equals: 'published' } },
            { publishedAt: { greater_than: '1970-01-01T00:00:00.000Z' } },
          ],
        },
      }),
    );
    expect(payload.find.mock.calls.map(([args]) => args.collection).sort()).toEqual([
      'faqs',
      'news',
      'pages',
      'products',
      'solutions',
    ]);
  });

  it('omits image-less products from public search sources', async () => {
    const payload = {
      find: vi.fn(async (args: PayloadFindArgs) => {
        if (args.collection === 'products') {
          return {
            docs: [
              { images: [{ file: { url: '/media/with-image.jpg' } }], name: '有图产品' },
              { images: [], name: '无图产品' },
              { image: { sizes: { card: { url: '/media/card.jpg' } } }, name: '卡片图产品' },
            ],
          };
        }

        return { docs: [] };
      }),
    };
    const unstableCache = vi.fn((fn: unknown) => fn);

    vi.resetModules();
    vi.doMock('next/cache', () => ({
      unstable_cache: unstableCache,
    }));
    vi.doMock('@/lib/cms/payload', () => ({
      getPayloadClient: vi.fn(() => Promise.resolve(payload)),
    }));
    const { getPayloadSearchSources } = await import('@/lib/search/payload');

    const sources = await getPayloadSearchSources(input);

    expect(sources.products.map((product) => product.name)).toEqual(['有图产品', '卡片图产品']);
  });
});

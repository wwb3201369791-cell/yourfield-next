import type * as ReactModule from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NewsItem } from '@/lib/cms/news';

type PayloadFindArgs = {
  collection: string;
  depth?: number;
  draft?: boolean;
  fallbackLocale?: string;
  limit?: number;
  locale?: string;
  overrideAccess?: boolean;
  pagination?: boolean;
  sort?: string | string[];
  where?: unknown;
};

type CmsDocument = Record<string, unknown>;
type DocsByCollection = Record<string, CmsDocument[]>;
type CacheableFunction = (...args: never[]) => unknown;

const defaultDocs: DocsByCollection = {
  news: [
    {
      excerpt: 'Company update excerpt',
      id: 'news-1',
      publishedAt: '2026-01-01T00:00:00.000Z',
      slug: 'company-update',
      title: 'Company update',
    },
  ],
  pages: [
    {
      id: 'page-1',
      pageKey: 'about',
      slug: 'about',
      title: 'About',
    },
  ],
  products: [
    {
      id: 'product-1',
      images: [{ file: { url: '/media/cms-only-product.png' } }],
      name: 'Firefighter Suit',
      productId: 'cms-only-product',
      slug: 'cms-only-product',
    },
  ],
};

function newsItem(
  slug: string,
  datePublished: string,
  isFeatured = false,
  featuredOrder?: number,
): NewsItem {
  return {
    author: 'YourField',
    category: 'news',
    content: [],
    datePublished,
    excerpt: slug,
    ...(typeof featuredOrder === 'number' ? { featuredOrder } : {}),
    image: '/images/news-placeholder.svg',
    ...(isFeatured ? { isFeatured: true } : {}),
    slug,
    title: slug,
  };
}

const createPayloadStub = (docsByCollection: DocsByCollection = defaultDocs) => ({
  find: vi.fn((args: PayloadFindArgs) =>
    Promise.resolve({
      docs: docsByCollection[args.collection] ?? [],
    }),
  ),
});

type PayloadStub = ReturnType<typeof createPayloadStub>;

const loadCmsModules = async (payload: PayloadStub = createPayloadStub()) => {
  vi.resetModules();
  vi.doMock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof ReactModule>();

    return {
      ...actual,
      cache: <T extends CacheableFunction>(fn: T) => fn,
    };
  });
  vi.doMock('@/lib/cms/payload', () => ({
    getPayloadClient: vi.fn(() => Promise.resolve(payload)),
  }));
  vi.doMock('next/cache', () => ({
    unstable_cache: (fn: CacheableFunction) => fn,
  }));

  const [pages, products, news] = await Promise.all([
    import('@/lib/cms/pages'),
    import('@/lib/cms/products'),
    import('@/lib/cms/news'),
  ]);

  return { news, pages, payload, products };
};

const findCall = (payload: PayloadStub, index: number): PayloadFindArgs => {
  const call = payload.find.mock.calls[index]?.[0];
  if (!call) {
    throw new Error(`Expected Payload find call ${index}.`);
  }

  return call;
};

const expectPublishedFilter = (where: unknown) => {
  const serialized = JSON.stringify(where);

  expect(serialized).toContain('_status');
  expect(serialized).toContain('published');
};

const expectPublishedProductFilter = (where: unknown) => {
  expectPublishedFilter(where);
  expect(JSON.stringify(where)).toContain('publishedAt');
};

const expectNoPublishedFilter = (where: unknown) => {
  const serialized = JSON.stringify(where);

  expect(serialized).not.toContain('_status');
  expect(serialized).not.toContain('published');
};

afterEach(() => {
  vi.doUnmock('@/lib/cms/payload');
  vi.doUnmock('next/cache');
  vi.doUnmock('react');
  vi.resetModules();
});

describe('CMS draft query construction', () => {
  it('keeps pages published-only by default and removes the status filter for Draft Mode', async () => {
    const { pages, payload } = await loadCmsModules();

    await pages.getCmsPageByKey('zh', 'about', false);
    await pages.getCmsPageByKey('zh', 'about', true);

    const publicQuery = findCall(payload, 0);
    const draftQuery = findCall(payload, 1);

    expect(publicQuery).toMatchObject({
      collection: 'pages',
      draft: false,
      locale: 'zh',
      overrideAccess: true,
    });
    expectPublishedFilter(publicQuery.where);
    expect(draftQuery).toMatchObject({
      collection: 'pages',
      draft: true,
      locale: 'zh',
      overrideAccess: true,
      where: { pageKey: { equals: 'about' } },
    });
    expectNoPublishedFilter(draftQuery.where);
  });

  it('keeps product queries published-only by default and removes the status filter for Draft Mode', async () => {
    const { payload, products } = await loadCmsModules();

    await products.getCmsProducts('zh', false);
    await products.getCmsProducts('zh', true);
    await products.getCmsProductBySlug('zh', 'cms-only-product', false);
    await products.getCmsProductBySlug('zh', 'cms-only-product', true);

    const publicListQuery = findCall(payload, 0);
    const draftListQuery = findCall(payload, 1);
    const publicDetailQuery = findCall(payload, 2);
    const draftDetailQuery = findCall(payload, 3);

    expect(publicListQuery).toMatchObject({
      collection: 'products',
      draft: false,
      locale: 'zh',
      overrideAccess: true,
    });
    expectPublishedProductFilter(publicListQuery.where);
    expect(draftListQuery).toMatchObject({
      collection: 'products',
      draft: true,
      locale: 'zh',
      overrideAccess: true,
    });
    expect(draftListQuery.where).toBeUndefined();
    expect(publicDetailQuery).toMatchObject({
      collection: 'products',
      draft: false,
      locale: 'zh',
      overrideAccess: true,
    });
    expectPublishedProductFilter(publicDetailQuery.where);
    expect(draftDetailQuery).toMatchObject({
      collection: 'products',
      draft: true,
      locale: 'zh',
      overrideAccess: true,
      where: {
        or: [
          { slug: { equals: 'cms-only-product' } },
          { productId: { equals: 'cms-only-product' } },
        ],
      },
    });
    expectNoPublishedFilter(draftDetailQuery.where);
  });

  it('maps CMS scenario cards for product detail pages and preserves legacy applications', async () => {
    const payload = createPayloadStub({
      products: [
        {
          applications: [{ value: 'legacy application' }],
          categoryId: 'chemical-medical',
          categoryName: '化学与医用防护',
          description: 'CMS 化学防护服详情',
          features: [],
          groupId: 'chemical-medical',
          id: 'cms-scenario-product',
          images: [{ file: { url: '/images/products/cms-scenario-product/main.png' } }],
          materials: [],
          model: 'CMS-001',
          name: 'CMS 场景产品',
          scenarios: [
            {
              description: '用于危化处置与医疗隔离。',
              title: 'CMS 场景卡片',
            },
          ],
          specifications: [],
          standards: [],
        },
      ],
    });
    const { products } = await loadCmsModules(payload);

    const cmsProduct = await products.getCmsProductBySlug('zh', 'cms-scenario-product', false);

    expect(cmsProduct?.scenarios?.map((scenario) => scenario.title.zh)).toEqual(['CMS 场景卡片']);
    expect(cmsProduct?.applications.map((application) => application.zh)).toEqual([
      'legacy application',
    ]);
    expect(cmsProduct?.scenarios?.[0]?.text.zh).toContain('危化处置');
  });

  it('hydrates product detail by id so localized visual gallery images are available', async () => {
    const listProduct = {
      id: 18,
      images: [{ file: { url: '/media/main.png' } }],
      name: '4级防电弧服（夹克款）41cal',
      productId: '4-ji-fang-dian-hu-fu-jia-ke-kuan-4-1-c-a-l',
      slug: '4-ji-fang-dian-hu-fu-jia-ke-kuan-4-1-c-a-l',
      visualGroups: [],
    };
    const detailProduct = {
      ...listProduct,
      visualGroups: [
        {
          images: [
            { file: { url: '/media/gallery-1.png' } },
            { file: { url: '/media/gallery-2.png' } },
          ],
          title: '产品图册',
          variant: 'gallery',
        },
      ],
    };
    const payload = {
      ...createPayloadStub({ products: [listProduct] }),
      findByID: vi.fn(() => Promise.resolve(detailProduct)),
    };
    const { products } = await loadCmsModules(payload);

    const cmsProduct = await products.getCmsProductBySlug(
      'zh',
      '4-ji-fang-dian-hu-fu-jia-ke-kuan-4-1-c-a-l',
      false,
    );

    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        depth: 2,
        fallbackLocale: 'none',
        id: 18,
        locale: 'zh',
      }),
    );
    expect(cmsProduct?.visualGroups?.[0]?.images).toEqual([
      '/media/gallery-1.png',
      '/media/gallery-2.png',
    ]);
  });

  it('keeps news queries published-only by default and removes the status filter for Draft Mode', async () => {
    const { news, payload } = await loadCmsModules();

    await news.getCmsNews('zh', false);
    await news.getCmsNews('zh', true);
    await news.getCmsNewsBySlug('zh', 'company-update', false);
    await news.getCmsNewsBySlug('zh', 'company-update', true);

    const publicListQuery = findCall(payload, 0);
    const draftListQuery = findCall(payload, 1);
    const publicDetailQuery = findCall(payload, 2);
    const draftDetailQuery = findCall(payload, 3);

    expect(publicListQuery).toMatchObject({
      collection: 'news',
      draft: false,
      locale: 'zh',
      overrideAccess: true,
      sort: '-publishedAt',
    });
    expectPublishedFilter(publicListQuery.where);
    expect(draftListQuery).toMatchObject({
      collection: 'news',
      draft: true,
      locale: 'zh',
      overrideAccess: true,
    });
    expect(draftListQuery.where).toBeUndefined();
    expect(publicDetailQuery).toMatchObject({
      collection: 'news',
      draft: false,
      locale: 'zh',
      overrideAccess: true,
    });
    expectPublishedFilter(publicDetailQuery.where);
    expect(draftDetailQuery).toMatchObject({
      collection: 'news',
      draft: true,
      locale: 'zh',
      overrideAccess: true,
      where: { slug: { equals: 'company-update' } },
    });
    expectNoPublishedFilter(draftDetailQuery.where);
  });

  it('uses the same newest-three split for homepage and news center highlights', async () => {
    const { news } = await loadCmsModules();
    const items = [
      newsItem('newest', '2026-05-20T00:00:00.000Z'),
      newsItem('second', '2026-05-09T00:00:00.000Z'),
      newsItem('third', '2026-05-01T00:00:00.000Z'),
      newsItem('fourth', '2026-04-30T00:00:00.000Z'),
    ];

    expect(news.FEATURED_NEWS_COUNT).toBe(3);
    expect(news.getFeaturedNewsItems(items).map((item) => item.slug)).toEqual([
      'newest',
      'second',
      'third',
    ]);
    expect(news.getNewsListItemsAfterFeatured(items).map((item) => item.slug)).toEqual(['fourth']);
  });

  it('maps CMS homepage recommendation flags onto public news items', async () => {
    const payload = createPayloadStub({
      news: [
        {
          excerpt: 'Recommended excerpt',
          id: 'news-recommended',
          isFeatured: true,
          publishedAt: '2026-05-09T00:00:00.000Z',
          slug: 'recommended-news',
          title: 'Recommended news',
        },
      ],
    });
    const { news } = await loadCmsModules(payload);

    await expect(news.getCmsNews('zh', false)).resolves.toMatchObject([
      {
        isFeatured: true,
        slug: 'recommended-news',
      },
    ]);
  });

  it('maps CMS featured position and card video onto public news items', async () => {
    const payload = createPayloadStub({
      news: [
        {
          cover: {
            sizes: {
              card: { url: '/media/news-card.webp' },
            },
            url: '/media/news-cover.webp',
          },
          excerpt: 'Featured video excerpt',
          featuredOrder: 1,
          featuredVideo: {
            mimeType: 'video/mp4',
            url: '/media/news-featured.mp4',
          },
          id: 'news-featured-video',
          publishedAt: '2026-05-20T00:00:00.000Z',
          slug: 'featured-video-news',
          title: 'Featured video news',
        },
      ],
    });
    const { news } = await loadCmsModules(payload);

    await expect(news.getCmsNews('zh', false)).resolves.toMatchObject([
      {
        featuredOrder: 1,
        image: '/media/news-card.webp',
        isFeatured: true,
        slug: 'featured-video-news',
        video: {
          poster: '/media/news-card.webp',
          src: '/media/news-featured.mp4',
        },
      },
    ]);
  });

  it('prioritizes homepage-recommended news before filling with newest items', async () => {
    const { news } = await loadCmsModules();
    const items = [
      newsItem('newest', '2026-05-20T00:00:00.000Z'),
      newsItem('recommended-older', '2026-05-09T00:00:00.000Z', true),
      newsItem('third', '2026-05-01T00:00:00.000Z'),
      newsItem('fourth', '2026-04-30T00:00:00.000Z'),
    ];

    expect(news.getFeaturedNewsItems(items).map((item) => item.slug)).toEqual([
      'recommended-older',
      'newest',
      'third',
    ]);
    expect(news.getNewsListItemsAfterFeatured(items).map((item) => item.slug)).toEqual(['fourth']);
  });

  it('orders featured news by the 1-based backend featured position', async () => {
    const { news } = await loadCmsModules();
    const items = [
      newsItem('latest-fallback', '2026-05-20T00:00:00.000Z'),
      newsItem('position-three', '2026-05-09T00:00:00.000Z', false, 3),
      newsItem('position-one', '2026-05-01T00:00:00.000Z', false, 1),
      newsItem('position-two', '2026-04-30T00:00:00.000Z', true, 2),
    ];

    expect(news.getFeaturedNewsItems(items).map((item) => item.slug)).toEqual([
      'position-one',
      'position-two',
      'position-three',
    ]);
    expect(news.getNewsListItemsAfterFeatured(items).map((item) => item.slug)).toEqual([
      'latest-fallback',
    ]);
  });
});

describe('CMS news fallback data', () => {
  it('returns empty public news when the CMS collection is empty', async () => {
    const payload = createPayloadStub({ news: [] });
    const { news } = await loadCmsModules(payload);

    const items = await news.getCmsNews('zh', false);

    expect(items).toEqual([]);
  });

  it('returns null when a published CMS slug is missing', async () => {
    const payload = createPayloadStub({ news: [] });
    const { news } = await loadCmsModules(payload);

    const item = await news.getCmsNewsBySlug('zh', 'may-day-safety-inspection', false);

    expect(item).toBeNull();
  });
});

describe('CMS news copy normalization', () => {
  it('keeps backend placeholder copy exactly as maintained in the CMS', async () => {
    const payload = createPayloadStub({
      news: [
        {
          content: {
            root: {
              children: [
                {
                  children: [{ text: '最终新闻摘要将在客户确认后更新。' }],
                  type: 'paragraph',
                },
                {
                  children: [{ text: '市委书记胡贺波带队督导检查“五一”节前安全生产工作' }],
                  type: 'paragraph',
                },
              ],
            },
          },
          excerpt: '最终新闻摘要将在客户确认后更新。',
          publishedAt: '2026-05-01T00:00:00.000Z',
          slug: 'may-day-safety-inspection',
          title: '市委书记胡贺波带队督导检查“五一”节前安全生产工作',
        },
        {
          excerpt: '后台已经维护好的真实摘要',
          publishedAt: '2026-05-02T00:00:00.000Z',
          slug: 'may-day-safety-inspection',
          title: '真实新闻',
        },
      ],
    });
    const { news } = await loadCmsModules(payload);

    const items = await news.getCmsNews('zh', false);

    expect(items[0]).toMatchObject({
      content: [
        {
          text: '最终新闻摘要将在客户确认后更新。',
          type: 'paragraph',
        },
        {
          text: '市委书记胡贺波带队督导检查“五一”节前安全生产工作',
          type: 'paragraph',
        },
      ],
      excerpt: '最终新闻摘要将在客户确认后更新。',
    });
    expect(items[1]?.excerpt).toBe('后台已经维护好的真实摘要');
  });
});

describe('CMS product optional content normalization', () => {
  it('uses direct 1-based product display order with zero-priority items last and stable ties', async () => {
    const payload = createPayloadStub({
      products: [
        {
          displayOrder: 0,
          id: 'product-zero-z',
          images: [{ file: { url: '/media/zero-priority-product.png' } }],
          name: 'Zero priority product',
          productId: 'zero-priority-product',
          slug: 'zero-priority-product',
        },
        {
          displayOrder: 3,
          id: 'product-three',
          images: [{ file: { url: '/media/third-product.png' } }],
          name: 'Third product',
          productId: 'third-product',
          slug: 'third-product',
        },
        {
          displayOrder: 1,
          id: 'product-one',
          images: [{ file: { url: '/media/first-product.png' } }],
          name: 'First product',
          productId: 'first-product',
          slug: 'first-product',
        },
        {
          displayOrder: 0,
          id: 'product-zero-a',
          images: [{ file: { url: '/media/alpha-zero-priority-product.png' } }],
          name: 'Alpha zero priority product',
          productId: 'alpha-zero-priority-product',
          slug: 'alpha-zero-priority-product',
        },
      ],
    });
    const { products } = await loadCmsModules(payload);

    const items = await products.getCmsProducts('zh', false);

    expect(findCall(payload, 0).sort).toEqual(['displayOrder', 'productId', 'id']);
    expect(items.map((item) => item.id)).toEqual([
      'first-product',
      'third-product',
      'alpha-zero-priority-product',
      'zero-priority-product',
    ]);
  });

  it('keeps backend products visible even when optional description is blank', async () => {
    const { products } = await loadCmsModules();

    const items = await products.getCmsProducts('zh', false);
    const detail = await products.getCmsProductBySlug('zh', 'cms-only-product', false);
    const listItem = items.find((item) => item.id === 'cms-only-product');

    expect(listItem).toMatchObject({
      description: { zh: '' },
      id: 'cms-only-product',
      image: '/media/cms-only-product.png',
      images: ['/media/cms-only-product.png'],
      model: '',
      name: { zh: 'Firefighter Suit' },
    });
    expect(detail).toMatchObject({
      description: { zh: '' },
      id: 'cms-only-product',
      image: '/media/cms-only-product.png',
      images: ['/media/cms-only-product.png'],
      model: '',
    });
  });

  it('hides published products without backend images instead of showing placeholders', async () => {
    const payload = createPayloadStub({
      products: [
        {
          id: 'product-1',
          name: '后台保留的旧文案',
          productId: 'live-line-shielding-suit',
          slug: 'live-line-shielding-suit',
        },
        {
          id: 'product-2',
          images: [{ file: { url: '/media/real-product.png' } }],
          name: '有图产品',
          productId: 'real-product',
          slug: 'real-product',
        },
      ],
    });
    const { products } = await loadCmsModules(payload);

    const items = await products.getCmsProducts('zh', false);
    const detail = await products.getCmsProductBySlug('zh', 'live-line-shielding-suit', false);
    const draftItems = await products.getCmsProducts('zh', true);
    const draftDetail = await products.getCmsProductBySlug('zh', 'live-line-shielding-suit', true);

    expect(items.map((item) => item.id)).toEqual(['real-product']);
    expect(detail).toBeNull();
    expect(draftItems.map((item) => item.id)).toEqual(['live-line-shielding-suit', 'real-product']);
    expect(draftDetail).toMatchObject({
      id: 'live-line-shielding-suit',
      image: '',
      images: [],
      name: { zh: '后台保留的旧文案' },
    });
  });

  it('does not restore fallback products after backend products are unpublished or deleted', async () => {
    const payload: PayloadStub = {
      find: vi.fn((args: PayloadFindArgs): Promise<{ docs: CmsDocument[] }> => {
        if (args.collection !== 'products') {
          return Promise.resolve({ docs: [] });
        }

        const isCollectionPresenceCheck = args.draft === true && args.limit === 1 && !args.where;
        const docs: CmsDocument[] = isCollectionPresenceCheck
          ? [
              {
                _status: 'draft',
                id: 'draft-product',
                name: 'Draft Product',
                productId: 'draft-product',
                slug: 'draft-product',
              },
            ]
          : [];

        return Promise.resolve({
          docs,
        });
      }),
    };
    const { products } = await loadCmsModules(payload);

    const items = await products.getCmsProducts('zh', false);
    const detail = await products.getCmsProductBySlug('zh', 'firefighter-suit-combat', false);

    expect(items).toEqual([]);
    expect(detail).toBeNull();
  });
});

import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const localizedText = {
  en: 'Draft content',
  ru: 'Draft content',
  zh: 'Draft content',
};

const product = {
  applications: [],
  categoryId: 'protective-clothing',
  categoryName: localizedText,
  description: localizedText,
  faqs: [],
  features: [],
  groupId: 'fire-rescue',
  id: 'draft-product',
  image: '/images/product.png',
  images: ['/images/product.png'],
  materials: [],
  model: 'YF-DRAFT',
  name: localizedText,
  specifications: [],
  standards: [],
};

const newsItem = {
  author: 'YourField',
  category: 'News',
  content: [{ text: 'Draft news body', type: 'paragraph' }],
  datePublished: '2026-01-01T00:00:00.000Z',
  excerpt: 'Draft news excerpt',
  image: '/images/news.png',
  slug: 'draft-news',
  title: 'Draft news',
};

const pageContent = {
  heroEnabled: true,
  heroImage: '/images/page.png',
  heroSubtitle: 'Draft page subtitle',
  heroTitle: 'Draft page hero',
  noIndex: false,
  seoDescription: 'Draft page description',
  seoImage: '/images/page-og.png',
  seoTitle: 'Draft page SEO title',
  slug: 'about',
  title: 'Draft page title',
};

const siteSettings = {
  contact: {},
  coordinates: { lat: 0, lng: 0, zoom: 1 },
};

type BuildMetadataArgs = {
  noIndex?: boolean;
};

async function loadPublicPages(isDraft: boolean) {
  const buildPageMetadata = vi.fn((args: BuildMetadataArgs) => ({
    robots: args.noIndex ? { follow: false, index: false } : { follow: true, index: true },
  }));
  const getCmsPageByKey = vi.fn(() => Promise.resolve(pageContent));
  const getHomeFeaturedProducts = vi.fn(() => Promise.resolve([product]));
  const getHomeProductSearchStats = vi.fn(() =>
    Promise.resolve({ catalogCount: 1, groupCount: 1 }),
  );
  const getCmsNews = vi.fn(() => Promise.resolve([newsItem]));
  const getCmsNewsBySlug = vi.fn(() => Promise.resolve(newsItem));
  const getCmsProductBySlug = vi.fn(() => Promise.resolve(product));
  const getCmsProductCategories = vi.fn(() => Promise.resolve([]));
  const getCmsProductGroups = vi.fn(() => Promise.resolve([]));
  const getCmsProducts = vi.fn(() => Promise.resolve([product]));

  vi.resetModules();
  vi.stubGlobal('React', React);
  vi.doMock('@/lib/preview/draft', () => ({
    isDraftModeEnabled: vi.fn(() => isDraft),
  }));
  vi.doMock('@/lib/i18n/route', () => ({
    resolveRouteLocale: vi.fn((locale: string) =>
      locale === 'en' || locale === 'ru' ? locale : 'zh',
    ),
    resolveRouteLocaleAndSlug: vi.fn(async (params: Promise<{ locale: string; slug: string }>) => {
      const { locale, slug } = await params;

      return {
        locale: locale === 'en' || locale === 'ru' ? locale : 'zh',
        slug,
      };
    }),
    resolveRouteLocaleFromParams: vi.fn(async (params: Promise<{ locale: string }>) => {
      const { locale } = await params;

      return locale === 'en' || locale === 'ru' ? locale : 'zh';
    }),
  }));
  vi.doMock('@/lib/i18n/getTranslations', () => ({
    getTranslations: vi.fn(() => Promise.resolve((key: string) => key)),
  }));
  vi.doMock('@/lib/seo/buildMetadata', () => ({
    buildPageMetadata,
    localizedPath: vi.fn((locale: string, path: string) =>
      path === '/' ? `/${locale}` : `/${locale}${path}`,
    ),
  }));
  vi.doMock('@/lib/seo/jsonld', () => ({
    breadcrumbJsonLd: vi.fn(() => ({})),
    collectionPageJsonLd: vi.fn(() => ({})),
    faqPageJsonLd: vi.fn(() => ({})),
    newsArticleJsonLd: vi.fn(() => ({})),
    organizationJsonLd: vi.fn(() => ({})),
    productJsonLd: vi.fn(() => ({})),
    websiteJsonLd: vi.fn(() => ({})),
  }));
  vi.doMock('@/lib/cms/home', () => ({
    getHomeFeaturedProducts,
    getHomeProductSearchStats,
  }));
  vi.doMock('@/lib/cms/news', () => ({
    getCmsNews,
    getCmsNewsBySlug,
    getCmsNewsStaticParams: vi.fn(() => Promise.resolve([])),
    getFeaturedNewsItems: vi.fn((items: readonly (typeof newsItem)[]) => items.slice(0, 3)),
    getNewsListItemsAfterFeatured: vi.fn((items: readonly (typeof newsItem)[]) => items.slice(3)),
  }));
  vi.doMock('@/lib/cms/pages', () => ({ getCmsPageByKey }));
  vi.doMock('@/lib/cms/products', () => ({
    getCmsProductBySlug,
    getCmsProductCategories,
    getCmsProductGroups,
    getCmsProductStaticParams: vi.fn(() => Promise.resolve([])),
    getCmsProducts,
    isCmsProductGroupId: vi.fn((value: unknown) => value === 'fire-rescue'),
  }));
  vi.doMock('@/lib/cms/site-settings', () => ({
    getCmsSiteSettings: vi.fn(() => Promise.resolve(siteSettings)),
  }));
  vi.doMock('@/lib/cms/media', () => ({
    shouldUseUnoptimizedImage: vi.fn(() => false),
  }));
  vi.doMock('@/components/public/JsonLd', () => ({ JsonLd: vi.fn(() => null) }));
  vi.doMock('@/components/public/PageHero', () => ({ PageHero: vi.fn(() => null) }));
  vi.doMock('@/components/public/SectionIntro', () => ({ SectionIntro: vi.fn(() => null) }));
  vi.doMock('@/components/public/CtaBand', () => ({ CtaBand: vi.fn(() => null) }));
  vi.doMock('@/components/product/ProductCard', () => ({ ProductCard: vi.fn(() => null) }));
  vi.doMock('@/components/news/NewsCard', () => ({ NewsCard: vi.fn(() => null) }));
  vi.doMock('@/components/ui/Carousel', () => ({ Carousel: vi.fn(() => null) }));
  vi.doMock('@/components/ui/DeferredCarousel', () => ({
    DeferredCarousel: vi.fn(() => null),
  }));
  vi.doMock('@/components/ui/icons', () => ({ ArrowRightIcon: vi.fn(() => null) }));
  vi.doMock('next/image', () => ({ default: vi.fn(() => null) }));
  vi.doMock('next/link', () => ({ default: vi.fn(() => null) }));
  vi.doMock('next/navigation', () => ({ notFound: vi.fn(() => undefined) }));

  const [home, products, productDetail, news, newsDetail, about] = await Promise.all([
    import('@/app/(site)/[locale]/(public)/page'),
    import('@/app/(site)/[locale]/(public)/products/page'),
    import('@/app/(site)/[locale]/(public)/products/[slug]/page'),
    import('@/app/(site)/[locale]/(public)/news/page'),
    import('@/app/(site)/[locale]/(public)/news/[slug]/page'),
    import('@/app/(site)/[locale]/(public)/about/page'),
  ]);

  return {
    about,
    buildPageMetadata,
    getCmsNews,
    getCmsNewsBySlug,
    getCmsPageByKey,
    getCmsProductBySlug,
    getCmsProductCategories,
    getCmsProductGroups,
    getCmsProducts,
    getHomeFeaturedProducts,
    getHomeProductSearchStats,
    home,
    news,
    newsDetail,
    productDetail,
    products,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
});

describe('public page Draft Mode integration', () => {
  it('passes draft=true into public CMS data fetches and marks preview metadata noindex', async () => {
    const modules = await loadPublicPages(true);

    await modules.home.default({ params: Promise.resolve({ locale: 'zh' }) });
    await modules.products.default({ params: Promise.resolve({ locale: 'zh' }) });
    await modules.news.default({ params: Promise.resolve({ locale: 'zh' }) });
    await modules.productDetail.default({
      params: Promise.resolve({ locale: 'zh', slug: 'draft-product' }),
    });
    await modules.newsDetail.generateMetadata({
      params: Promise.resolve({ locale: 'zh', slug: 'draft-news' }),
    });
    await modules.about.generateMetadata({ params: Promise.resolve({ locale: 'zh' }) });

    expect(modules.getHomeFeaturedProducts).toHaveBeenCalledWith('zh', true);
    expect(modules.getCmsProducts).toHaveBeenCalledWith('zh', true);
    expect(modules.getCmsProductGroups).toHaveBeenCalledWith('zh');
    expect(modules.getCmsNews).toHaveBeenCalledWith('zh', true);
    expect(modules.getCmsProductBySlug).toHaveBeenCalledWith('zh', 'draft-product', true);
    expect(modules.getCmsNewsBySlug).toHaveBeenCalledWith('zh', 'draft-news', true);
    expect(modules.getCmsPageByKey).toHaveBeenCalledWith('zh', 'about', true);
    expect(modules.buildPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ noIndex: true }),
    );
  }, 15000);

  it('passes draft=false for normal public requests and keeps metadata indexable', async () => {
    const modules = await loadPublicPages(false);

    await modules.productDetail.generateMetadata({
      params: Promise.resolve({ locale: 'zh', slug: 'draft-product' }),
    });
    await modules.newsDetail.generateMetadata({
      params: Promise.resolve({ locale: 'zh', slug: 'draft-news' }),
    });
    await modules.about.generateMetadata({ params: Promise.resolve({ locale: 'zh' }) });

    expect(modules.getCmsProductBySlug).toHaveBeenCalledWith('zh', 'draft-product', false);
    expect(modules.getCmsNewsBySlug).toHaveBeenCalledWith('zh', 'draft-news', false);
    expect(modules.getCmsPageByKey).toHaveBeenCalledWith('zh', 'about', false);
    expect(modules.buildPageMetadata).toHaveBeenCalledTimes(3);
    expect(modules.buildPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ noIndex: false }),
    );
  });
});

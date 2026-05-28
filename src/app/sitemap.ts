import type { MetadataRoute } from 'next';
import type { Where } from 'payload/types';

import { getPayloadClient } from '@/lib/cms/payload';
import { newsItems as fallbackNewsItems } from '@/lib/mock/news';
import { products as fallbackProducts } from '@/lib/mock/products';
import {
  contentSitemapEntries,
  isSafeSitemapSlug,
  localizedSitemapEntries,
  type SitemapContentItem,
} from '@/lib/seo/assets';

export const revalidate = 600;

type SitemapCollection = 'news' | 'products';

type CmsSitemapDoc = Readonly<{
  productId?: unknown;
  publishedAt?: unknown;
  slug?: unknown;
  updatedAt?: unknown;
}>;

const fallbackProductItems = fallbackProducts
  .map((product) => product.id)
  .filter(isSafeSitemapSlug)
  .sort()
  .map((slug) => ({ slug }));

const fallbackNewsItemsForSitemap = fallbackNewsItems
  .map((item) => item.slug)
  .filter(isSafeSitemapSlug)
  .sort()
  .map((slug) => ({ slug }));

function asDate(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toSitemapContentItem(doc: CmsSitemapDoc): SitemapContentItem | null {
  const slug = isSafeSitemapSlug(doc.slug)
    ? doc.slug
    : isSafeSitemapSlug(doc.productId)
      ? doc.productId
      : null;

  if (!slug) {
    return null;
  }

  const lastModified = asDate(doc.updatedAt) ?? asDate(doc.publishedAt);

  return {
    slug,
    ...(lastModified ? { lastModified } : {}),
  };
}

function sitemapPublishedWhere(collection: SitemapCollection): Where {
  const statusWhere: Where = {
    _status: {
      equals: 'published',
    },
  };

  if (collection !== 'products') {
    return statusWhere;
  }

  return {
    and: [statusWhere, { publishedAt: { greater_than: '1970-01-01T00:00:00.000Z' } }],
  };
}

async function getCmsSitemapItems(collection: SitemapCollection) {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection,
      depth: 0,
      draft: false,
      fallbackLocale: 'none',
      limit: 1000,
      locale: 'zh',
      overrideAccess: true,
      pagination: false,
      sort: collection === 'news' ? '-publishedAt' : 'slug',
      where: sitemapPublishedWhere(collection),
    });

    return (result.docs as CmsSitemapDoc[])
      .map(toSitemapContentItem)
      .filter((item): item is SitemapContentItem => item !== null)
      .sort((left, right) => left.slug.localeCompare(right.slug));
  } catch {
    return [];
  }
}

async function hasCmsCollectionDocuments(collection: SitemapCollection) {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection,
      depth: 0,
      draft: true,
      fallbackLocale: 'none',
      limit: 1,
      locale: 'zh',
      overrideAccess: true,
      pagination: false,
    });

    return result.docs.length > 0;
  } catch {
    return false;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cmsProducts, cmsNews, hasCmsProducts] = await Promise.all([
    getCmsSitemapItems('products'),
    getCmsSitemapItems('news'),
    hasCmsCollectionDocuments('products'),
  ]);
  const productItems =
    cmsProducts.length > 0 || hasCmsProducts ? cmsProducts : fallbackProductItems;
  const newsItems = cmsNews.length > 0 ? cmsNews : fallbackNewsItemsForSitemap;

  return [
    ...localizedSitemapEntries(),
    ...contentSitemapEntries({
      basePath: '/products',
      changeFrequency: 'weekly',
      items: productItems,
      priority: 0.85,
    }),
    ...contentSitemapEntries({
      basePath: '/news',
      changeFrequency: 'weekly',
      items: newsItems,
      priority: 0.7,
    }),
  ];
}

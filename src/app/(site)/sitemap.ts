import type { MetadataRoute } from 'next';
import type { Where } from 'payload';

import { getPayloadClient } from '@/lib/cms/payload';
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
  seo?: { noindex?: unknown };
  slug?: unknown;
  updatedAt?: unknown;
}>;

function asDate(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toSitemapContentItem(doc: CmsSitemapDoc): SitemapContentItem | null {
  if (doc.seo?.noindex === true) {
    return null;
  }

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
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productItems, newsItems] = await Promise.all([
    getCmsSitemapItems('products'),
    getCmsSitemapItems('news'),
  ]);

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

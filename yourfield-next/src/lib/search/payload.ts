import { unstable_cache } from 'next/cache';
import type { Where } from 'payload/types';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag } from '@/lib/cms/cache';
import { getPayloadClient } from '@/lib/cms/payload';
import { recommendedProductHitsFromSources } from '@/lib/search/search';
import {
  defaultSearchStatsLimit,
  getHotSearchTermsFromPayload,
  getSearchStatsFromPayload,
  isSearchLogsSchemaError,
} from '@/lib/search/stats';
import type {
  SearchClickRequest,
  SearchHit,
  SearchLocale,
  SearchQuery,
  SearchSourceDocument,
  SearchSources,
} from '@/lib/search/types';

function emptyResult() {
  return Promise.resolve({ docs: [] as SearchSourceDocument[] });
}

function includesType(input: SearchQuery, type: Exclude<SearchQuery['type'], 'all'>) {
  return input.type === 'all' || input.type === type;
}

function logSearchLogWriteError(error: unknown) {
  if (isSearchLogsSchemaError(error)) {
    return;
  }

  console.error('[search] log write failed', {
    error: error instanceof Error ? error.message : 'Unknown search log error',
  });
}

function publicProductSearchWhere(): Where {
  return {
    and: [
      { _status: { equals: 'published' } },
      { publishedAt: { greater_than: '1970-01-01T00:00:00.000Z' } },
    ],
  };
}

async function findPublishedSearchProducts(locale: SearchLocale) {
  const payload = await getPayloadClient();

  return payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
    pagination: false,
    where: publicProductSearchWhere(),
  });
}

const getCachedSearchProducts = unstable_cache(
  findPublishedSearchProducts,
  ['payload-search-products'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('products')],
  },
);

async function findPublishedSearchNews(locale: SearchLocale) {
  const payload = await getPayloadClient();

  return payload.find({
    collection: 'news',
    depth: 2,
    draft: false,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
    pagination: false,
    where: { _status: { equals: 'published' } },
  });
}

const getCachedSearchNews = unstable_cache(findPublishedSearchNews, ['payload-search-news'], {
  revalidate: CMS_CACHE_REVALIDATE_SECONDS,
  tags: [cmsCollectionCacheTag('news')],
});

async function findPublishedSearchPages(locale: SearchLocale) {
  const payload = await getPayloadClient();

  return payload.find({
    collection: 'pages',
    depth: 2,
    draft: false,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
    pagination: false,
    where: { _status: { equals: 'published' } },
  });
}

const getCachedSearchPages = unstable_cache(findPublishedSearchPages, ['payload-search-pages'], {
  revalidate: CMS_CACHE_REVALIDATE_SECONDS,
  tags: [cmsCollectionCacheTag('pages')],
});

async function findPublishedSearchFaqs(locale: SearchLocale) {
  const payload = await getPayloadClient();

  return payload.find({
    collection: 'faqs',
    depth: 2,
    locale,
    overrideAccess: true,
    pagination: false,
    where: { isPublished: { equals: true } },
  });
}

const getCachedSearchFaqs = unstable_cache(findPublishedSearchFaqs, ['payload-search-faqs'], {
  revalidate: CMS_CACHE_REVALIDATE_SECONDS,
  tags: [cmsCollectionCacheTag('faqs')],
});

export async function getPayloadSearchSources(input: SearchQuery): Promise<SearchSources> {
  const [products, news, pages, faqs] = await Promise.all([
    includesType(input, 'product') ? getCachedSearchProducts(input.locale) : emptyResult(),
    includesType(input, 'news') ? getCachedSearchNews(input.locale) : emptyResult(),
    includesType(input, 'page') ? getCachedSearchPages(input.locale) : emptyResult(),
    includesType(input, 'faq') ? getCachedSearchFaqs(input.locale) : emptyResult(),
  ]);

  return {
    faqs: faqs.docs,
    news: news.docs,
    pages: pages.docs,
    products: products.docs,
  };
}

export async function writePayloadSearchLog({
  hits,
  input,
  ip,
}: Readonly<{
  hits: number;
  input: SearchQuery;
  ip: string;
}>) {
  const query = input.q.trim();

  if (!query) {
    return;
  }

  try {
    const payload = await getPayloadClient();

    await payload.create({
      collection: 'search-logs',
      data: {
        eventType: 'search',
        hits,
        ip,
        locale: input.locale,
        query,
      },
      overrideAccess: true,
    });
  } catch (error) {
    logSearchLogWriteError(error);
  }
}

export async function writePayloadSearchClickLog({
  input,
  ip,
}: Readonly<{
  input: SearchClickRequest;
  ip: string;
}>) {
  const query = input.query.trim();

  if (!query) {
    return;
  }

  try {
    const payload = await getPayloadClient();

    await payload.create({
      collection: 'search-logs',
      data: {
        eventType: 'result-click',
        hits: input.hits,
        ip,
        locale: input.locale,
        query,
        resultId: input.result.id,
        resultTitle: input.result.title,
        resultType: input.result.type,
        resultUrl: input.result.url,
      },
      overrideAccess: true,
    });
  } catch (error) {
    logSearchLogWriteError(error);
  }
}

export async function getPayloadSearchStats(
  params: Readonly<{
    limit?: number;
    locale?: SearchLocale;
  }>,
) {
  const payload = await getPayloadClient();

  return getSearchStatsFromPayload(payload, {
    ...(params.locale ? { locale: params.locale } : {}),
    limit: params.limit ?? defaultSearchStatsLimit,
  });
}

export async function getPayloadRecommendedProductHits(
  input: Pick<SearchQuery, 'locale'>,
): Promise<SearchHit[]> {
  const payload = await getPayloadClient();
  const products = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    fallbackLocale: 'none',
    limit: 12,
    locale: input.locale,
    overrideAccess: true,
    sort: 'displayOrder',
    where: publicProductSearchWhere(),
  });

  return recommendedProductHitsFromSources({ products: products.docs }, input.locale, 3);
}

export async function getPayloadHotSearchTerms(
  locale: SearchLocale,
  fallbackTerms: readonly string[],
  limit: number,
) {
  try {
    const payload = await getPayloadClient();

    return await getHotSearchTermsFromPayload(payload, {
      fallbackTerms,
      limit,
      locale,
    });
  } catch (error) {
    if (!isSearchLogsSchemaError(error)) {
      console.error('[search] hot terms query failed', {
        error: error instanceof Error ? error.message : 'Unknown hot terms error',
      });
    }

    return fallbackTerms.slice(0, limit);
  }
}

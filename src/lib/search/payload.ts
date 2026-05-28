import { unstable_cache } from 'next/cache';
import type { Where } from 'payload/types';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag } from '@/lib/cms/cache';
import { getPayloadClient } from '@/lib/cms/payload';
import { industryCases } from '@/lib/content/solutions';
import { getFlatMessages } from '@/lib/i18n/getMessages';
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

const HOT_SEARCH_REVALIDATE_SECONDS = 86_400;

const industryCaseAnchors: Record<string, string> = {
  'case-electronics': 'industry-electronics',
  'case-emergency': 'industry-emergency',
  'case-food': 'industry-food',
  'case-manufacturing': 'industry-manufacturing',
  'case-medical': 'industry-medical',
  'case-metal': 'industry-metal',
  'case-petro': 'industry-petrochemical',
  'case-power': 'industry-power',
};

function translatedMessage(locale: SearchLocale, key: string) {
  return getFlatMessages(locale)[key] ?? '';
}

function getStaticIndustryCaseSearchDocs(locale: SearchLocale): SearchSourceDocument[] {
  return industryCases.map((item) => {
    const anchor = industryCaseAnchors[item.id] ?? item.id;

    return {
      anchor,
      href: `/${locale}/products#${anchor}`,
      id: item.id,
      image: item.image,
      meta: translatedMessage(locale, item.metaKey),
      text: translatedMessage(locale, item.textKey),
      title: translatedMessage(locale, item.titleKey),
    };
  });
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

async function findPublishedSearchSolutions(locale: SearchLocale) {
  const payload = await getPayloadClient();

  return payload.find({
    collection: 'solutions',
    depth: 2,
    draft: false,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
    pagination: false,
    sort: 'order',
    where: { _status: { equals: 'published' } },
  });
}

const getCachedSearchSolutions = unstable_cache(
  findPublishedSearchSolutions,
  ['payload-search-solutions'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('solutions')],
  },
);

export async function getPayloadSearchSources(input: SearchQuery): Promise<SearchSources> {
  const [products, news, pages, faqs, solutions] = await Promise.all([
    getCachedSearchProducts(input.locale),
    getCachedSearchNews(input.locale),
    getCachedSearchPages(input.locale),
    getCachedSearchFaqs(input.locale),
    getCachedSearchSolutions(input.locale),
  ]);

  return {
    faqs: faqs.docs,
    industryCases: getStaticIndustryCaseSearchDocs(input.locale),
    news: news.docs,
    pages: pages.docs,
    products: products.docs,
    solutions: solutions.docs,
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

type PayloadClient = Awaited<ReturnType<typeof getPayloadClient>>;

function productHotTerm(product: SearchSourceDocument) {
  return typeof product.name === 'string' && product.name.trim() ? product.name.trim() : '';
}

function dedupeTerms(terms: readonly string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const term of terms) {
    const normalized = term.trim().replace(/\s+/g, ' ');
    const key = normalized.toLocaleLowerCase();

    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(normalized);
  }

  return deduped;
}

async function getRecentPublishedProductHotTerms(
  payload: PayloadClient,
  locale: SearchLocale,
  limit: number,
) {
  try {
    const products = await payload.find({
      collection: 'products',
      depth: 0,
      draft: false,
      fallbackLocale: 'none',
      limit,
      locale,
      overrideAccess: true,
      sort: '-publishedAt',
      where: publicProductSearchWhere(),
    });

    return dedupeTerms((products.docs as SearchSourceDocument[]).map(productHotTerm));
  } catch (error) {
    console.warn('[search] recent product hot terms query failed', {
      error: error instanceof Error ? error.message : 'Unknown product hot terms error',
    });

    return [];
  }
}

async function getPayloadHotSearchTermsUncached(
  locale: SearchLocale,
  fallbackTerms: readonly string[],
  limit: number,
) {
  try {
    const payload = await getPayloadClient();
    const recentProductTerms = await getRecentPublishedProductHotTerms(payload, locale, limit);

    return await getHotSearchTermsFromPayload(payload, {
      fallbackTerms: dedupeTerms([...recentProductTerms, ...fallbackTerms]),
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

const getCachedPayloadHotSearchTerms = unstable_cache(
  getPayloadHotSearchTermsUncached,
  ['payload-hot-search-terms'],
  {
    revalidate: HOT_SEARCH_REVALIDATE_SECONDS,
  },
);

export async function getPayloadHotSearchTerms(
  locale: SearchLocale,
  fallbackTerms: readonly string[],
  limit: number,
) {
  return getCachedPayloadHotSearchTerms(locale, fallbackTerms, limit);
}

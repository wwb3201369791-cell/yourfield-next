import { unstable_cache } from 'next/cache';
import type { Where } from 'payload/types';
import { cache } from 'react';

import {
  extractedProducts,
  getExtractedProductById,
  hasVisibleProductImage,
} from '@/lib/content/extractedProducts';
import { env } from '@/lib/env';
import { locales, type Locale } from '@/lib/i18n/locale';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag } from '../cache';
import { getPayloadClient } from '../payload';

import { compareCmsProductDisplayOrder, mapCmsProduct } from './mappers';
import type { CmsProduct } from './types';

const extractedProductCacheVersion = `extracted-products-${extractedProducts.length}-real-images-hyf5506-legacy-detail`;

type PayloadClient = Awaited<ReturnType<typeof getPayloadClient>>;

const publishedProductConditions: Where[] = [
  { _status: { equals: 'published' } },
  { publishedAt: { greater_than: '1970-01-01T00:00:00.000Z' } },
];

function publicProductWhere(...conditions: Where[]): Where {
  return {
    and: [...conditions, ...publishedProductConditions],
  };
}

async function findCmsProductById(
  payload: PayloadClient,
  product: CmsProduct,
  locale: Locale,
  draft: boolean,
) {
  if (!product.id || typeof payload.findByID !== 'function') {
    return product;
  }

  return (await payload.findByID({
    collection: 'products',
    depth: 2,
    draft,
    fallbackLocale: 'none',
    id: product.id,
    locale,
    overrideAccess: true,
  })) as CmsProduct;
}

async function hasCmsProductDocuments(locale: Locale, payloadClient?: PayloadClient) {
  const payload = payloadClient ?? (await getPayloadClient());
  const result = await payload.find({
    collection: 'products',
    depth: 0,
    draft: true,
    fallbackLocale: 'none',
    limit: 1,
    locale,
    overrideAccess: true,
    pagination: false,
  });

  return result.docs.length > 0;
}

async function getCmsProductsUncached(locale: Locale, draft = false) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
    pagination: false,
    sort: 'displayOrder',
    ...(!draft
      ? {
          where: publicProductWhere(),
        }
      : {}),
  });
  const cmsProducts = (result.docs as CmsProduct[])
    .sort(compareCmsProductDisplayOrder)
    .map(mapCmsProduct);

  if (cmsProducts.length > 0) {
    return cmsProducts;
  }

  if (await hasCmsProductDocuments(locale, payload)) {
    return [];
  }

  return extractedProducts;
}

const getCachedCmsProducts = unstable_cache(
  async (locale: Locale) => getCmsProductsUncached(locale, false),
  ['cms-products', extractedProductCacheVersion],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('products')],
  },
);

function shouldBypassProductCache() {
  return env.NODE_ENV !== 'production' || !env.REVALIDATE_SECRET;
}

export const getCmsProducts = cache(async (locale: Locale, draft = false) => {
  return draft || shouldBypassProductCache()
    ? getCmsProductsUncached(locale, draft)
    : getCachedCmsProducts(locale);
});

async function getCmsProductBySlugUncached(locale: Locale, slug: string, draft = false) {
  const payload = await getPayloadClient();
  const productLookup: Where = {
    or: [{ slug: { equals: slug } }, { productId: { equals: slug } }],
  };
  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft,
    fallbackLocale: 'none',
    limit: 1,
    locale,
    overrideAccess: true,
    where: draft ? productLookup : publicProductWhere(productLookup),
  });

  const product = result.docs[0] as CmsProduct | undefined;

  if (!product) {
    return (await hasCmsProductDocuments(locale, payload))
      ? null
      : (getExtractedProductById(slug) ?? null);
  }

  const mappedProduct = mapCmsProduct(await findCmsProductById(payload, product, locale, draft));

  return mappedProduct;
}

const getCachedCmsProductBySlug = unstable_cache(
  async (locale: Locale, slug: string) => getCmsProductBySlugUncached(locale, slug, false),
  ['cms-product-by-slug', extractedProductCacheVersion],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('products')],
  },
);

export const getCmsProductBySlug = cache(async (locale: Locale, slug: string, draft = false) => {
  return draft || shouldBypassProductCache()
    ? getCmsProductBySlugUncached(locale, slug, draft)
    : getCachedCmsProductBySlug(locale, slug);
});

async function getFeaturedCmsProductsUncached(locale: Locale, limit = 6, draft = false) {
  const products = await getCmsProductsUncached(locale, draft);
  const productsWithImages = products.filter(hasVisibleProductImage);

  return (productsWithImages.length > 0 ? productsWithImages : products).slice(0, limit);
}

const getCachedFeaturedCmsProducts = unstable_cache(
  async (locale: Locale, limit: number = 6) => getFeaturedCmsProductsUncached(locale, limit, false),
  ['cms-featured-products', extractedProductCacheVersion],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('products')],
  },
);

export const getFeaturedCmsProducts = cache(async (locale: Locale, limit = 6, draft = false) => {
  return draft || shouldBypassProductCache()
    ? getFeaturedCmsProductsUncached(locale, limit, draft)
    : getCachedFeaturedCmsProducts(locale, limit);
});

export async function getCmsProductStaticParams() {
  const products = await getCmsProducts('zh');

  return locales.flatMap((locale) => products.map((product) => ({ locale, slug: product.id })));
}

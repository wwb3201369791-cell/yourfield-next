import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { env } from '@/lib/env';
import type { Locale } from '@/lib/i18n/locale';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag } from '../cache';
import { getPayloadClient } from '../payload';

import { mapCmsCategory } from './mappers';
import type { CmsCategory, CmsProductCategory, CmsProductGroup, CmsProductGroupDoc } from './types';
import { asString } from './utils';

async function findProductCategoryDocs(locale: Locale) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'product-categories',
    depth: 2,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
    pagination: false,
    sort: 'order',
  });

  return result.docs as CmsCategory[];
}

async function getCmsProductCategoriesUncached(
  locale: Locale,
): Promise<readonly CmsProductCategory[]> {
  const docs = await findProductCategoryDocs(locale);

  return docs
    .map(mapCmsCategory)
    .filter((category): category is CmsProductCategory => Boolean(category))
    .sort((left, right) => left.order - right.order);
}

const getCachedCmsProductCategories = unstable_cache(
  getCmsProductCategoriesUncached,
  ['cms-product-categories'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('product-categories'), cmsCollectionCacheTag('product-groups')],
  },
);

function shouldBypassProductGroupCache() {
  return env.NODE_ENV !== 'production' || !env.REVALIDATE_SECRET;
}

export const getCmsProductCategories = cache(async (locale: Locale) =>
  shouldBypassProductGroupCache()
    ? getCmsProductCategoriesUncached(locale)
    : getCachedCmsProductCategories(locale),
);

async function getCmsProductGroupsUncached(locale: Locale): Promise<readonly CmsProductGroup[]> {
  const payload = await getPayloadClient();
  const groupResult = await payload.find({
    collection: 'product-groups',
    depth: 0,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
    pagination: false,
    sort: 'order',
    where: {
      showOnFrontend: {
        not_equals: false,
      },
    },
  });
  const categoryDocs = await findProductCategoryDocs(locale);
  const groupDocs = groupResult.docs as CmsProductGroupDoc[];
  const cmsCategories = categoryDocs
    .map(mapCmsCategory)
    .filter((category): category is CmsProductCategory => Boolean(category));
  const groups: CmsProductGroup[] = [];

  groupDocs.forEach((group, index) => {
    const id = asString(group.groupId);
    const description = asString(group.description);

    if (!id) {
      return;
    }

    groups.push({
      categoryIds: cmsCategories
        .filter((category) => category.groupId === id)
        .map((category) => category.id),
      id,
      order: group.order ?? index + 1,
      title: asString(group.name, id),
      ...(description ? { description } : {}),
    });
  });

  return groups.sort((left, right) => left.order - right.order);
}

const getCachedCmsProductGroups = unstable_cache(
  getCmsProductGroupsUncached,
  ['cms-product-groups'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('product-groups'), cmsCollectionCacheTag('product-categories')],
  },
);

export const getCmsProductGroups = cache(async (locale: Locale) =>
  shouldBypassProductGroupCache()
    ? getCmsProductGroupsUncached(locale)
    : getCachedCmsProductGroups(locale),
);

import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { getTranslations } from '@/lib/i18n/getTranslations';
import type { Locale } from '@/lib/i18n/locale';
import type { ProductGroupId } from '@/lib/mock/products';
import type { SiteNavigationItem } from '@/lib/navigation';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag, cmsGlobalCacheTag } from '../cache';
import { getCmsNavigation } from '../navigation';
import { getPayloadClient } from '../payload';

import { productGroupIdList, productGroupTitleKeys } from './constants';
import { groupIdFromCategory, mapCmsCategory } from './mappers';
import type { CmsCategory, CmsProductCategory, CmsProductGroup, CmsProductGroupDoc } from './types';
import { asString, isCmsProductGroupId } from './utils';

function groupIdFromHref(href: string) {
  try {
    const url = new URL(href, 'https://yourfield.local');
    const group = url.searchParams.get('group') || url.hash.replace(/^#/, '');

    return isCmsProductGroupId(group) ? group : null;
  } catch {
    return null;
  }
}

function collectProductGroupLabels(
  items: readonly SiteNavigationItem[],
  labels = new Map<ProductGroupId, string>(),
) {
  for (const item of items) {
    const groupId = groupIdFromHref(item.href);

    if (groupId) {
      labels.set(groupId, item.label);
    }

    if (item.children) {
      collectProductGroupLabels(item.children, labels);
    }
  }

  return labels;
}

function fallbackGroups(locale: Locale): Promise<CmsProductGroup[]> {
  return getTranslations(locale).then((t) =>
    productGroupIdList.map((id, index) => ({
      categoryIds: [],
      id,
      order: index + 1,
      title: t(productGroupTitleKeys[id] ?? id),
    })),
  );
}

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

export const getCmsProductCategories = cache(getCachedCmsProductCategories);

async function getCmsProductGroupsUncached(locale: Locale): Promise<readonly CmsProductGroup[]> {
  const [payload, navigation, fallbackProductGroups] = await Promise.all([
    getPayloadClient(),
    getCmsNavigation(locale),
    fallbackGroups(locale),
  ]);
  const [groupResult, categoryDocs] = await Promise.all([
    payload.find({
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
    }),
    findProductCategoryDocs(locale),
  ]);
  const groupDocs = groupResult.docs as CmsProductGroupDoc[];
  const cmsCategories = categoryDocs
    .map(mapCmsCategory)
    .filter((category): category is CmsProductCategory => Boolean(category));

  if (groupDocs.length > 0) {
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

  const docs = categoryDocs;

  if (docs.length === 0) {
    return fallbackProductGroups;
  }

  const groupLabels = collectProductGroupLabels(navigation.mainNav);
  const groups = new Map<ProductGroupId, { categoryIds: string[]; order: number }>();

  for (const category of docs) {
    const groupId = groupIdFromCategory(category);

    if (!category.categoryId) {
      continue;
    }

    const existing = groups.get(groupId);
    const order = category.order ?? Number.MAX_SAFE_INTEGER;

    if (existing) {
      existing.categoryIds.push(category.categoryId);
      existing.order = Math.min(existing.order, order);
    } else {
      groups.set(groupId, {
        categoryIds: [category.categoryId],
        order,
      });
    }
  }

  if (groups.size === 0) {
    return fallbackProductGroups;
  }

  return Array.from(groups.entries())
    .sort(([, left], [, right]) => left.order - right.order)
    .map(([id, group]) => ({
      categoryIds: group.categoryIds,
      id,
      order: group.order,
      title:
        groupLabels.get(id) ??
        fallbackProductGroups.find((fallbackGroup) => fallbackGroup.id === id)?.title ??
        id,
    }));
}

const getCachedCmsProductGroups = unstable_cache(
  getCmsProductGroupsUncached,
  ['cms-product-groups'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [
      cmsCollectionCacheTag('product-groups'),
      cmsCollectionCacheTag('product-categories'),
      cmsGlobalCacheTag('navigation'),
    ],
  },
);

export const getCmsProductGroups = cache(getCachedCmsProductGroups);

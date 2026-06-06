import { env } from '@/lib/env';
import type { Locale } from '@/lib/i18n/locale';
import { unstableCacheOrPassThrough } from '@/lib/next-cache';
import { reactCacheOrPassThrough } from '@/lib/react-cache';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag } from './cache';
import { normalizeCmsMediaUrl } from './media';
import { getPayloadClient } from './payload';

type TextRow = {
  value?: string;
};

type CmsUpload = {
  sizes?: Record<string, { url?: string } | undefined>;
  tags?: TextRow[];
  url?: string;
};

type CmsRelationWithName = {
  name?: string;
  title?: string;
};

type CmsSolutionDoc = {
  content?: unknown;
  cover?: CmsUpload | number | string;
  features?: TextRow[];
  order?: number;
  productTags?: TextRow[];
  relatedCategories?: Array<CmsRelationWithName | number | string>;
  relatedProductGroups?: Array<CmsRelationWithName | number | string>;
  relatedProducts?: Array<CmsRelationWithName | number | string>;
  slug?: string;
  solutionId?: string;
  summary?: string;
  title?: string;
};

export type CmsSolution = Readonly<{
  features: readonly string[];
  href: string;
  id: string;
  image: string;
  order: number;
  productTags: readonly string[];
  summary: string;
  title: string;
}>;

const emptySolutionImage = '';

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function richTextToPlainText(value: unknown) {
  const parts: string[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') {
      return;
    }

    const record = node as Record<string, unknown>;
    if (typeof record.text === 'string') {
      parts.push(record.text);
    }

    if (Array.isArray(record.children)) {
      record.children.forEach(walk);
    }

    if (record.root) {
      walk(record.root);
    }
  }

  walk(value);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function mediaUrl(file: CmsSolutionDoc['cover']) {
  if (!file || typeof file !== 'object') {
    return emptySolutionImage;
  }

  return normalizeCmsMediaUrl(file.url ?? file.sizes?.card?.url, emptySolutionImage);
}

function mapRows(rows: TextRow[] | undefined) {
  return (rows ?? []).map((row) => row.value).filter((value): value is string => Boolean(value));
}

function relationLabel(relation: CmsRelationWithName | number | string) {
  if (!relation || typeof relation !== 'object') {
    return undefined;
  }

  return asString(relation.name, asString(relation.title)) || undefined;
}

function relationLabels(relations: CmsSolutionDoc['relatedProductGroups']) {
  return (relations ?? []).map(relationLabel).filter((value): value is string => Boolean(value));
}

function mapCmsSolution(solution: CmsSolutionDoc, index: number): CmsSolution | null {
  const id = asString(solution.slug, asString(solution.solutionId));
  const title = asString(solution.title, id);

  if (!id || !title) {
    return null;
  }

  const summary = asString(solution.summary) || richTextToPlainText(solution.content) || title;
  const productTags = mapRows(solution.productTags);
  const fallbackTags = [
    ...relationLabels(solution.relatedProductGroups),
    ...relationLabels(solution.relatedCategories),
    ...relationLabels(solution.relatedProducts),
  ];

  return {
    features: mapRows(solution.features),
    href: '/products',
    id,
    image: mediaUrl(solution.cover),
    order: solution.order ?? index + 1,
    productTags: productTags.length > 0 ? productTags : fallbackTags,
    summary,
    title,
  };
}

async function getCmsSolutionsUncached(locale: Locale, draft = false) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'solutions',
    depth: 2,
    draft,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
    pagination: false,
    sort: 'order',
    ...(!draft
      ? {
          where: {
            _status: {
              equals: 'published',
            },
          },
        }
      : {}),
  });

  return (result.docs as CmsSolutionDoc[])
    .map(mapCmsSolution)
    .filter((solution): solution is CmsSolution => Boolean(solution))
    .sort((left, right) => left.order - right.order);
}

const getCachedCmsSolutions = unstableCacheOrPassThrough(
  async (locale: Locale) => getCmsSolutionsUncached(locale, false),
  ['cms-solutions'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('solutions')],
  },
);

export const getCmsSolutions = reactCacheOrPassThrough(async (locale: Locale, draft = false) => {
  if (draft || env.NODE_ENV !== 'production') {
    return getCmsSolutionsUncached(locale, draft);
  }

  return getCachedCmsSolutions(locale);
});

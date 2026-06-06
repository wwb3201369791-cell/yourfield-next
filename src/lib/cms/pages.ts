import { cache } from 'react';

import type { Locale } from '@/lib/i18n/locale';
import { unstableCacheOrPassThrough } from '@/lib/next-cache';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag } from './cache';
import { getPayloadClient } from './payload';
import { cmsSeoMediaUrl, mapCmsSeo, type CmsSeoUpload } from './seo';

type CmsUpload = CmsSeoUpload;

type CmsPageHero = {
  backgroundImage?: CmsUpload | number | string;
  enabled?: boolean;
  subtitle?: string;
  title?: string;
};

type CmsPageSeo = {
  canonical?: string;
  description?: string;
  keywords?: string;
  noindex?: boolean;
  ogImage?: CmsUpload | number | string;
  title?: string;
};

type CmsPage = {
  hero?: CmsPageHero;
  pageKey?: string;
  seo?: CmsPageSeo;
  slug?: string;
  title?: string;
};

export type CmsPageContent = Readonly<{
  heroEnabled: boolean;
  heroImage?: string;
  heroSubtitle?: string;
  heroTitle?: string;
  noIndex: boolean;
  seoCanonical?: string;
  seoDescription?: string;
  seoImage?: string;
  seoKeywords: readonly string[];
  seoTitle?: string;
  slug: string;
  title: string;
}>;

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function mediaUrl(file: CmsUpload | number | string | undefined) {
  return cmsSeoMediaUrl(file);
}

function mapCmsPage(page: CmsPage): CmsPageContent {
  const title = asString(page.title, asString(page.pageKey));
  const hero = page.hero;
  const seo = page.seo;
  const heroImage = mediaUrl(hero?.backgroundImage);
  const heroSubtitle = asString(hero?.subtitle);
  const heroTitle = asString(hero?.title);
  const seoFields = mapCmsSeo(seo);

  return {
    heroEnabled: hero?.enabled ?? true,
    ...(heroImage ? { heroImage } : {}),
    ...(heroSubtitle ? { heroSubtitle } : {}),
    ...(heroTitle ? { heroTitle } : {}),
    noIndex: seoFields.noIndex,
    ...(seoFields.canonical ? { seoCanonical: seoFields.canonical } : {}),
    ...(seoFields.description ? { seoDescription: seoFields.description } : {}),
    ...(seoFields.image ? { seoImage: seoFields.image } : {}),
    seoKeywords: seoFields.keywords,
    ...(seoFields.title ? { seoTitle: seoFields.title } : {}),
    slug: asString(page.slug),
    title,
  };
}

async function getCmsPageByKeyUncached(locale: Locale, pageKey: string, draft = false) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'pages',
    depth: 2,
    draft,
    fallbackLocale: 'none',
    limit: 1,
    locale,
    overrideAccess: true,
    where: draft
      ? { pageKey: { equals: pageKey } }
      : {
          and: [{ pageKey: { equals: pageKey } }, { _status: { equals: 'published' } }],
        },
  });

  const page = result.docs[0] as CmsPage | undefined;

  return page ? mapCmsPage(page) : null;
}

const getCachedCmsPageByKey = unstableCacheOrPassThrough(
  async (locale: Locale, pageKey: string) => getCmsPageByKeyUncached(locale, pageKey, false),
  ['cms-page-by-key'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('pages')],
  },
);

export const getCmsPageByKey = cache(async (locale: Locale, pageKey: string, draft = false) => {
  return draft
    ? getCmsPageByKeyUncached(locale, pageKey, true)
    : getCachedCmsPageByKey(locale, pageKey);
});

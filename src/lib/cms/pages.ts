import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import type { Locale } from '@/lib/i18n/locale';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag } from './cache';
import { normalizeCmsMediaUrl } from './media';
import { getPayloadClient } from './payload';

type CmsUpload = {
  sizes?: Record<string, { url?: string } | undefined>;
  url?: string;
};

type CmsPageHero = {
  backgroundImage?: CmsUpload | number | string;
  enabled?: boolean;
  subtitle?: string;
  title?: string;
};

type CmsPageSeo = {
  description?: string;
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
  seoDescription?: string;
  seoImage?: string;
  seoTitle?: string;
  slug: string;
  title: string;
}>;

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function mediaUrl(file: CmsUpload | number | string | undefined) {
  if (!file || typeof file !== 'object') {
    return undefined;
  }

  return normalizeCmsMediaUrl(file.sizes?.card?.url ?? file.url, '');
}

function mapCmsPage(page: CmsPage): CmsPageContent {
  const title = asString(page.title, asString(page.pageKey));
  const hero = page.hero;
  const seo = page.seo;
  const heroImage = mediaUrl(hero?.backgroundImage);
  const heroSubtitle = asString(hero?.subtitle);
  const heroTitle = asString(hero?.title);
  const seoDescription = asString(seo?.description);
  const seoImage = mediaUrl(seo?.ogImage);
  const seoTitle = asString(seo?.title);

  return {
    heroEnabled: hero?.enabled ?? true,
    ...(heroImage ? { heroImage } : {}),
    ...(heroSubtitle ? { heroSubtitle } : {}),
    ...(heroTitle ? { heroTitle } : {}),
    noIndex: Boolean(seo?.noindex),
    ...(seoDescription ? { seoDescription } : {}),
    ...(seoImage ? { seoImage } : {}),
    ...(seoTitle ? { seoTitle } : {}),
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

const getCachedCmsPageByKey = unstable_cache(
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

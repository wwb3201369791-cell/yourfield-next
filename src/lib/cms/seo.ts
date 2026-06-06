import { normalizeCmsMediaUrl } from './media';

export type CmsSeoUpload = {
  sizes?: Record<string, { url?: string } | undefined>;
  url?: string;
};

export type CmsSeo = {
  canonical?: string;
  description?: string;
  keywords?: string;
  noindex?: boolean;
  ogImage?: CmsSeoUpload | number | string;
  title?: string;
};

export type PublicSeo = Readonly<{
  canonical?: string;
  description?: string;
  image?: string;
  keywords: readonly string[];
  noIndex: boolean;
  title?: string;
}>;

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function cmsSeoMediaUrl(file: CmsSeo['ogImage']) {
  if (!file || typeof file !== 'object') {
    return undefined;
  }

  return normalizeCmsMediaUrl(file.url ?? file.sizes?.card?.url, '');
}

export function cmsSeoKeywordList(value: unknown) {
  return typeof value === 'string'
    ? value
        .split(/[，,]/)
        .map((keyword) => keyword.trim())
        .filter(Boolean)
    : [];
}

export function mapCmsSeo(seo: CmsSeo | undefined): PublicSeo {
  const canonical = asString(seo?.canonical);
  const description = asString(seo?.description);
  const image = cmsSeoMediaUrl(seo?.ogImage);
  const keywords = cmsSeoKeywordList(seo?.keywords);
  const title = asString(seo?.title);

  return {
    ...(canonical ? { canonical } : {}),
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    keywords,
    noIndex: Boolean(seo?.noindex),
    ...(title ? { title } : {}),
  };
}

export function seoKeywordsText(seo: PublicSeo | undefined) {
  return seo?.keywords.join(' ') ?? '';
}

export function hasPublicSeo(seo: PublicSeo | undefined) {
  return Boolean(
    seo &&
    (seo.title ||
      seo.description ||
      seo.image ||
      seo.canonical ||
      seo.noIndex ||
      seo.keywords.length > 0),
  );
}

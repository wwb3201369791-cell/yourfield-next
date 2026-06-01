import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { locales, type Locale } from '@/lib/i18n/locale';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag } from './cache';
import { normalizeCmsMediaUrl } from './media';
import { getPayloadClient } from './payload';

type CmsUpload = {
  alt?: string;
  caption?: string;
  height?: number;
  mimeType?: string;
  sizes?: Record<string, { url?: string } | undefined>;
  url?: string;
  width?: number;
};

type CmsNews = {
  author?: string;
  category?: string;
  content?: unknown;
  cover?: CmsUpload | number | string;
  excerpt?: string;
  featuredOrder?: number;
  featuredVideo?: CmsUpload | number | string;
  featuredVideoRu?: CmsUpload | number | string;
  isFeatured?: boolean;
  publishedAt?: string;
  slug?: string;
  title?: string;
  updatedAt?: string;
};

export type NewsItem = Readonly<{
  author: string;
  category: string;
  content: readonly NewsContentBlock[];
  dateModified?: string;
  datePublished: string;
  excerpt: string;
  featuredOrder?: number;
  image: string;
  isFeatured?: boolean;
  slug: string;
  title: string;
  video?: Readonly<{
    poster: string;
    src: string;
  }>;
}>;

export const FEATURED_NEWS_COUNT = 3;

export type NewsContentBlock =
  | Readonly<{
      text: string;
      type: 'paragraph';
    }>
  | Readonly<{
      level: 2 | 3 | 4;
      text: string;
      type: 'heading';
    }>
  | Readonly<{
      text: string;
      type: 'quote';
    }>
  | Readonly<{
      items: readonly string[];
      ordered: boolean;
      type: 'list';
    }>
  | Readonly<{
      alt: string;
      caption?: string;
      height?: number;
      src: string;
      type: 'image';
      width?: number;
    }>;

const emptyNewsImage = '';
const categoryLabels: Record<string, Record<Locale, string>> = {
  announcement: {
    zh: '公告',
    en: 'Announcement',
    ru: 'Объявление',
  },
  event: {
    zh: '活动',
    en: 'Event',
    ru: 'Событие',
  },
  exhibition: {
    zh: '展会',
    en: 'Exhibition',
    ru: 'Выставка',
  },
  news: {
    zh: '公司新闻',
    en: 'Company News',
    ru: 'Новости компании',
  },
};

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mediaUrl(file: CmsNews['cover']) {
  if (!file || typeof file !== 'object') {
    return emptyNewsImage;
  }

  return normalizeCmsMediaUrl(file.url ?? file.sizes?.card?.url, emptyNewsImage);
}

function mediaOriginalUrl(file: CmsUpload | number | string | undefined) {
  if (!file || typeof file !== 'object') {
    return '';
  }

  return normalizeCmsMediaUrl(file.url, '');
}

function textFromNode(node: unknown): string {
  if (!isRecord(node)) {
    return '';
  }

  const ownText = typeof node.text === 'string' ? node.text : '';
  const childText = Array.isArray(node.children) ? node.children.map(textFromNode).join('') : '';

  return ownText + childText;
}

function normalizedTextFromNode(node: unknown) {
  return textFromNode(node).replace(/\s+/g, ' ').trim();
}

function uploadImageFromNode(node: Record<string, unknown>): NewsContentBlock | null {
  if (node.type !== 'upload' || !isRecord(node.value)) {
    return null;
  }

  const upload = node.value as CmsUpload;
  const feature = upload.sizes?.feature;
  const card = upload.sizes?.card;
  const src = normalizeCmsMediaUrl(feature?.url ?? card?.url ?? upload.url, '');

  if (!src) {
    return null;
  }

  const fields = isRecord(node.fields) ? node.fields : {};
  const caption = asString(fields.caption, asString(upload.caption));
  const alt = asString(upload.alt, caption || '新闻图片');

  return {
    alt,
    ...(caption ? { caption } : {}),
    ...(typeof upload.height === 'number' ? { height: upload.height } : {}),
    src,
    type: 'image',
    ...(typeof upload.width === 'number' ? { width: upload.width } : {}),
  };
}

function headingLevel(node: Record<string, unknown>): 2 | 3 | 4 {
  return node.tag === 'h4' ? 4 : node.tag === 'h3' ? 3 : 2;
}

function richTextToBlocks(value: unknown) {
  const blocks: NewsContentBlock[] = [];

  function walk(node: unknown) {
    if (!isRecord(node)) {
      return;
    }

    if (node.root) {
      walk(node.root);
    }

    if (node.type === 'paragraph') {
      const text = normalizedTextFromNode(node);
      if (text) {
        blocks.push({ text, type: 'paragraph' });
      }
      return;
    }

    if (node.type === 'heading') {
      const text = normalizedTextFromNode(node);
      if (text) {
        blocks.push({ level: headingLevel(node), text, type: 'heading' });
      }
      return;
    }

    if (node.type === 'quote') {
      const text = normalizedTextFromNode(node);
      if (text) {
        blocks.push({ text, type: 'quote' });
      }
      return;
    }

    if (node.type === 'list') {
      const items = Array.isArray(node.children)
        ? node.children.map(normalizedTextFromNode).filter(Boolean)
        : [];
      if (items.length > 0) {
        blocks.push({
          items,
          ordered: node.listType === 'number' || node.listType === 'numbered',
          type: 'list',
        });
      }
      return;
    }

    if (node.type === 'upload') {
      const image = uploadImageFromNode(node);
      if (image) {
        blocks.push(image);
      }
      return;
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
  }

  walk(value);

  return blocks;
}

function textFromContentBlock(block: NewsContentBlock): string {
  if (block.type === 'image') {
    return block.caption ?? block.alt;
  }

  if (block.type === 'list') {
    return block.items.join(' ');
  }

  return block.text;
}

function categoryLabel(category: string | undefined, locale: Locale) {
  const key = asString(category, 'news');

  return categoryLabels[key]?.[locale] ?? key;
}

function normalizedFeaturedOrder(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function localizedFeaturedVideo(item: CmsNews, locale: Locale) {
  if (locale === 'ru') {
    return item.featuredVideoRu ?? item.featuredVideo;
  }

  return item.featuredVideo;
}

function mapCmsNews(item: CmsNews, locale: Locale): NewsItem {
  const slug = asString(item.slug);
  const title = asString(item.title, slug);
  const content = richTextToBlocks(item.content);
  const firstTextBlock = content.find((block) => block.type !== 'image');
  const excerpt = asString(
    item.excerpt,
    firstTextBlock ? textFromContentBlock(firstTextBlock) : title,
  );
  const datePublished = asString(item.publishedAt, new Date(0).toISOString());
  const dateModified = asString(item.updatedAt, datePublished);
  const featuredOrder = normalizedFeaturedOrder(item.featuredOrder);
  const image = mediaUrl(item.cover);
  const featuredVideoSrc = mediaOriginalUrl(localizedFeaturedVideo(item, locale));
  const isFeatured = Boolean(item.isFeatured || featuredOrder);

  return {
    author: asString(item.author, '永霏集团'),
    category: categoryLabel(item.category, locale),
    content: content.length > 0 ? content : [{ text: excerpt, type: 'paragraph' }],
    ...(dateModified ? { dateModified } : {}),
    datePublished,
    excerpt,
    ...(featuredOrder ? { featuredOrder } : {}),
    image,
    ...(isFeatured ? { isFeatured: true } : {}),
    slug,
    title,
    ...(featuredVideoSrc ? { video: { poster: image, src: featuredVideoSrc } } : {}),
  };
}

async function getCmsNewsUncached(locale: Locale, draft = false) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'news',
    depth: 2,
    draft,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
    pagination: false,
    sort: '-publishedAt',
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

  const items = (result.docs as CmsNews[])
    .map((item) => mapCmsNews(item, locale))
    .filter((item) => item.slug);

  return items;
}

const getCachedCmsNews = unstable_cache(
  async (locale: Locale) => getCmsNewsUncached(locale, false),
  ['cms-news'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('news')],
  },
);

export const getCmsNews = cache(async (locale: Locale, draft = false) => {
  return draft ? getCmsNewsUncached(locale, true) : getCachedCmsNews(locale);
});

function selectedFeaturedNewsItems(items: readonly NewsItem[]) {
  const featuredItems = items
    .filter((item) => item.isFeatured || featuredOrderValue(item) < Number.MAX_SAFE_INTEGER)
    .sort(compareFeaturedNewsItems)
    .slice(0, FEATURED_NEWS_COUNT);
  const featuredSlugs = new Set(featuredItems.map((item) => item.slug));
  const fillItems = items
    .filter((item) => !featuredSlugs.has(item.slug))
    .slice(0, Math.max(0, FEATURED_NEWS_COUNT - featuredItems.length));

  return [...featuredItems, ...fillItems];
}

function featuredOrderValue(item: NewsItem) {
  return typeof item.featuredOrder === 'number' && item.featuredOrder > 0
    ? item.featuredOrder
    : Number.MAX_SAFE_INTEGER;
}

function compareFeaturedNewsItems(first: NewsItem, second: NewsItem) {
  const firstOrder = featuredOrderValue(first);
  const secondOrder = featuredOrderValue(second);

  if (firstOrder !== secondOrder) {
    return firstOrder - secondOrder;
  }

  return new Date(second.datePublished).getTime() - new Date(first.datePublished).getTime();
}

export function getFeaturedNewsItems(items: readonly NewsItem[]) {
  return selectedFeaturedNewsItems(items);
}

export function getNewsListItemsAfterFeatured(items: readonly NewsItem[]) {
  const featuredSlugs = new Set(selectedFeaturedNewsItems(items).map((item) => item.slug));

  return items.filter((item) => !featuredSlugs.has(item.slug));
}

async function getCmsNewsBySlugUncached(locale: Locale, slug: string, draft = false) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'news',
    depth: 2,
    draft,
    fallbackLocale: 'none',
    limit: 1,
    locale,
    overrideAccess: true,
    where: draft
      ? { slug: { equals: slug } }
      : {
          and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
        },
  });

  const item = result.docs[0] as CmsNews | undefined;

  return item ? mapCmsNews(item, locale) : null;
}

const getCachedCmsNewsBySlug = unstable_cache(
  async (locale: Locale, slug: string) => getCmsNewsBySlugUncached(locale, slug, false),
  ['cms-news-by-slug'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [cmsCollectionCacheTag('news')],
  },
);

export const getCmsNewsBySlug = cache(async (locale: Locale, slug: string, draft = false) => {
  return draft
    ? getCmsNewsBySlugUncached(locale, slug, true)
    : getCachedCmsNewsBySlug(locale, slug);
});

export async function getCmsNewsStaticParams() {
  const items = await getCmsNews('zh');

  return locales.flatMap((locale) => items.map((item) => ({ locale, slug: item.slug })));
}

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
  image: string;
  slug: string;
  title: string;
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

const fallbackNewsImage = '/images/news-placeholder.svg';
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

const legacyNewsPlaceholderMarkers: Record<Locale, readonly string[]> = {
  zh: [
    '最终新闻摘要将在客户确认后更新。',
    '最终新闻正文和媒体素材将在客户确认后发布。',
    '新闻正文和媒体素材将在客户确认后发布。',
    '此页面预留用于客户确认后的新闻内容。',
  ],
  en: [
    'Final article summary will be updated after client confirmation.',
    'Final article copy and media will be published after client confirmation.',
    'The full article and media assets will be published after client confirmation.',
    'This page is reserved for client-approved news content.',
  ],
  ru: [
    'Финальное резюме статьи будет обновлено после подтверждения клиента.',
    'Финальный текст статьи и медиа будут опубликованы после подтверждения клиента.',
    'Полный текст новости и медиа будут опубликованы после подтверждения.',
    'Эта страница зарезервирована для подтвержденных клиентом новостей.',
  ],
};

const legacySeededNewsSummaries: Record<string, Record<Locale, string>> = {
  'may-day-safety-inspection': {
    zh: '围绕节前安全生产检查要求，相关领导深入企业一线，督导安全责任落实和生产运行保障工作。',
    en: 'The inspection focused on workplace safety before the May Day holiday, with on-site guidance for safety responsibility and production safeguards.',
    ru: 'Проверка перед майскими праздниками была посвящена производственной безопасности, ответственности на местах и стабильной работе предприятия.',
  },
  'hunan-labor-award-publicity': {
    zh: '湘潭市发布2026年湖南省五一劳动奖状、奖章和工人先锋号推荐对象公示，展示先进集体与个人的示范力量。',
    en: 'Xiangtan published its recommended candidates for the 2026 Hunan May Day Labor Awards, highlighting model teams and individuals.',
    ru: 'Сянтань опубликовал список рекомендованных кандидатов на награды Hunan May Day Labor Awards 2026, отмечая образцовые коллективы и сотрудников.',
  },
  'yonghe-protection-established': {
    zh: '湖南永核防护科技有限公司正式挂牌成立，为应急装备产业链协同发展注入新动能。',
    en: 'Hunan Yonghe Protection Technology Co., Ltd. was officially established, adding momentum to the emergency equipment industry chain.',
    ru: 'Hunan Yonghe Protection Technology Co., Ltd. официально учреждена, усиливая кооперацию в цепочке аварийно-спасательного оборудования.',
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
    return fallbackNewsImage;
  }

  return normalizeCmsMediaUrl(file.sizes?.card?.url ?? file.url, fallbackNewsImage);
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

  return {
    author: asString(item.author, '永霏集团'),
    category: categoryLabel(item.category, locale),
    content: content.length > 0 ? content : [{ text: excerpt, type: 'paragraph' }],
    ...(dateModified ? { dateModified } : {}),
    datePublished,
    excerpt,
    image: mediaUrl(item.cover),
    slug,
    title,
  };
}

function isLegacyNewsPlaceholder(value: string, locale: Locale) {
  return legacyNewsPlaceholderMarkers[locale].some((marker) => value.includes(marker));
}

function modernizeLegacySeededNewsCopy(item: NewsItem, locale: Locale): NewsItem {
  const summary = legacySeededNewsSummaries[item.slug]?.[locale];

  if (!summary) {
    return item;
  }

  const hasLegacyExcerpt = isLegacyNewsPlaceholder(item.excerpt, locale);
  const hasLegacyContent = item.content.some((block) =>
    isLegacyNewsPlaceholder(textFromContentBlock(block), locale),
  );

  if (!hasLegacyExcerpt && !hasLegacyContent) {
    return item;
  }

  return {
    ...item,
    content: hasLegacyContent ? [{ text: summary, type: 'paragraph' }] : item.content,
    excerpt: hasLegacyExcerpt ? summary : item.excerpt,
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

  return (result.docs as CmsNews[])
    .map((item) => modernizeLegacySeededNewsCopy(mapCmsNews(item, locale), locale))
    .filter((item) => item.slug);
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

export function getFeaturedNewsItems(items: readonly NewsItem[]) {
  return items.slice(0, FEATURED_NEWS_COUNT);
}

export function getNewsListItemsAfterFeatured(items: readonly NewsItem[]) {
  return items.slice(FEATURED_NEWS_COUNT);
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

  return item ? modernizeLegacySeededNewsCopy(mapCmsNews(item, locale), locale) : null;
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

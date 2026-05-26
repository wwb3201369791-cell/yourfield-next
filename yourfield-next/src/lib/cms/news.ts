import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { locales, type Locale } from '@/lib/i18n/locale';
import { newsBodyFallback, newsItems as fallbackNewsItems } from '@/lib/mock/news';

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

type FallbackNewsCopy = Readonly<{
  excerpt: string;
  title: string;
}>;

const fallbackNewsCopy: Readonly<Record<string, Record<Locale, FallbackNewsCopy>>> = {
  'advanced-emergency-equipment-catalog': {
    zh: {
      title: '工信部发布先进安全应急装备推广目录，永霏四大产品入选',
      excerpt:
        '近日，工业和信息化部办公厅发布《先进安全应急装备推广目录（工业领域2025版）》，其“先进个体防护装备”类别包含20项装备，永霏被列为消防员灭火防护服、熔融金属飞溅防护服、防电弧服、防静电服4项关键装备的参考供应商。',
    },
    en: {
      title:
        'MIIT Releases Advanced Safety and Emergency Equipment Promotion Catalog; Four Yongfei Products Selected',
      excerpt:
        'Recently, the General Office of the Ministry of Industry and Information Technology released the Advanced Safety and Emergency Equipment Promotion Catalog (2025 Industrial Edition). In its advanced personal protective equipment category, Yongfei was listed as a reference supplier for four key products.',
    },
    ru: {
      title:
        'МИИТ опубликовал каталог передового оборудования для безопасности и ЧС; четыре продукта Yongfei включены в список',
      excerpt:
        'Недавно Главное управление Министерства промышленности и информатизации выпустило Каталог продвижения передового оборудования для безопасности и ЧС (промышленная версия 2025). Yongfei указана как справочный поставщик четырех ключевых средств индивидуальной защиты.',
    },
  },
  'hunan-labor-award-publicity': {
    zh: {
      title: '湘潭市2026年湖南省五一劳动奖状、奖章和湖南省工人先锋号推荐对象公示公告',
      excerpt:
        '湘潭市发布2026年湖南省五一劳动奖状、奖章和工人先锋号推荐对象公示，展示先进集体与个人的示范力量。',
    },
    en: {
      title:
        "Public Notice of Xiangtan's 2026 Hunan May Day Labor Awards and Worker Pioneer Recommendations",
      excerpt:
        'Xiangtan published its recommended candidates for the 2026 Hunan May Day Labor Awards, highlighting model teams and individuals.',
    },
    ru: {
      title:
        'Публичное объявление о рекомендованных кандидатах Сянтаня на награды Hunan May Day Labor Awards 2026',
      excerpt:
        'Сянтань опубликовал список рекомендованных кандидатов на награды Hunan May Day Labor Awards 2026, отмечая образцовые коллективы и сотрудников.',
    },
  },
  'li-wenhui-hunan-entrepreneur': {
    zh: {
      title: '李文辉：入选百人榜的湖湘实业家，以“防护”铸就时代担当',
      excerpt:
        '近日，中共湖南省委、湖南省人民政府正式印发《关于表彰新湖南贡献奖全省优秀民营企业家的决定》，永霏集团总裁李文辉凭借在产业创新、社会责任与区域发展中的突出贡献，光荣入选100人表彰名单，成为湖南民营企业家群体的杰出代表。这份荣誉，既是对李文辉总裁二十载深耕实业、勇担使命的高度认可，更是对永霏集团扎根湖湘、服务国家的坚实肯定。',
    },
    en: {
      title:
        'Li Wenhui: A Huxiang Industrialist on the Top 100 List, Shouldering the Times Through Protection',
      excerpt:
        'The CPC Hunan Provincial Committee and the Hunan Provincial Government recently announced the New Hunan Contribution Award for outstanding private entrepreneurs. Yongfei Group President Li Wenhui was honored among the 100 recognized entrepreneurs.',
    },
    ru: {
      title:
        'Ли Вэньхуэй: промышленник Хунани из списка ста выдающихся предпринимателей, несущий ответственность через защиту',
      excerpt:
        'Провинциальный комитет КПК Хунани и правительство провинции Хунань недавно объявили лауреатов премии New Hunan Contribution Award для выдающихся частных предпринимателей. Президент Yongfei Group Ли Вэньхуэй вошел в число 100 отмеченных предпринимателей.',
    },
  },
  'may-day-safety-inspection': {
    zh: {
      title: '市委书记胡贺波带队督导检查“五一”节前安全生产工作',
      excerpt:
        '围绕节前安全生产检查要求，相关领导深入企业一线，督导安全责任落实和生产运行保障工作。',
    },
    en: {
      title: 'Xiangtan Party Secretary Hu Hebo Leads Pre-May Day Safety Production Inspection',
      excerpt:
        'The inspection focused on workplace safety before the May Day holiday, with on-site guidance for safety responsibility and production safeguards.',
    },
    ru: {
      title:
        'Секретарь парткома Сянтаня Ху Хэбо провел проверку безопасности производства перед Первомаем',
      excerpt:
        'Проверка перед майскими праздниками была посвящена производственной безопасности, ответственности на местах и стабильной работе предприятия.',
    },
  },
  'provincial-technology-platform': {
    zh: {
      title: '实力彰显！拿下省级重要技术“牌照”',
      excerpt:
        '近日，湖南省发展和改革委员会发布《关于公示2025年度湖南省工程研究中心和企业技术中心拟认定名单的通知》，永霏凭借突出的技术创新实力荣列“企业技术中心拟认定名单”之中。',
    },
    en: {
      title:
        'Strength on Display: Yongfei Secures an Important Provincial Technology Certification',
      excerpt:
        'Recently, the Hunan Provincial Development and Reform Commission published the proposed 2025 list of Hunan engineering research centers and enterprise technology centers. Yongfei was included among the proposed enterprise technology centers for its innovation capabilities.',
    },
    ru: {
      title: 'Сила подтверждена: Yongfei получила важное провинциальное технологическое признание',
      excerpt:
        'Недавно Комиссия по развитию и реформам провинции Хунань опубликовала предварительный список инженерных исследовательских центров и корпоративных технологических центров 2025 года. Yongfei вошла в список благодаря инновационному потенциалу.',
    },
  },
  'strategy-seminar-2026': {
    zh: {
      title: '破局立新，共启新程！永霏集团2026年发展战略研讨会圆满落幕',
      excerpt:
        '冬日衡山，层林尽染，群贤毕至，共谋新篇。2025年12月13日至14日，永霏集团以“破局立新，共绘2026年业绩增长新模式”为主题的战略研讨会，在南岳衡山顺利召开。集团核心管理团队齐聚一堂，以思想碰撞凝聚发展共识，以战略研讨锚定前行方向，以团队协作汇聚奋进力量，为集团新一年高质量发展擘画宏伟蓝图、夯实执行根基。',
    },
    en: {
      title:
        "Breaking Through and Opening a New Chapter: Yongfei Group's 2026 Development Strategy Seminar Concludes Successfully",
      excerpt:
        'From December 13 to 14, 2025, Yongfei Group held its 2026 development strategy seminar at Mount Heng, gathering core management teams to align strategy and execution for high-quality growth in the new year.',
    },
    ru: {
      title:
        'Прорыв и новый этап: стратегический семинар Yongfei Group по развитию в 2026 году успешно завершен',
      excerpt:
        '13-14 декабря 2025 года Yongfei Group провела стратегический семинар по развитию 2026 года на горе Хэншань, объединив ключевую управленческую команду для согласования стратегии и исполнения.',
    },
  },
  'textile-brand-cultivation': {
    zh: {
      title: '脱颖而出！永霏获评2025年省级纺织服装行业重点培育品牌',
      excerpt:
        '近日，湖南省工业和信息化厅公示了2025年湖南省纺织服装行业重点培育品牌拟定名单，永霏凭借卓越的综合实力与品牌发展潜力成功入选全省仅十席的重点品牌行列。这份荣誉，不仅是对永霏多年来在个体防护领域持续深耕的肯定，更是对永霏始终坚守安全防护初心、以科技守护生命的深刻回响。',
    },
    en: {
      title:
        'Standing Out: Yongfei Named a 2025 Provincial Key Cultivation Brand in the Textile and Apparel Industry',
      excerpt:
        'Recently, the Hunan Department of Industry and Information Technology publicized the proposed 2025 list of key cultivation brands in the provincial textile and apparel industry. Yongfei was selected among the limited provincial seats.',
    },
    ru: {
      title:
        'Yongfei выделилась и вошла в число ключевых брендов текстильной и швейной отрасли провинции 2025 года',
      excerpt:
        'Недавно Департамент промышленности и информатизации провинции Хунань опубликовал предварительный список ключевых брендов текстильной и швейной отрасли 2025 года. Yongfei вошла в ограниченный провинциальный список.',
    },
  },
  'yonghe-protection-established': {
    zh: {
      title: '应急装备产业链迎来新力量！湖南永核防护科技有限公司正式挂牌成立',
      excerpt: '湖南永核防护科技有限公司正式挂牌成立，为应急装备产业链协同发展注入新动能。',
    },
    en: {
      title:
        'New Force in the Emergency Equipment Industry Chain: Hunan Yonghe Protection Technology Co., Ltd. Officially Established',
      excerpt:
        'Hunan Yonghe Protection Technology Co., Ltd. was officially established, adding momentum to the emergency equipment industry chain.',
    },
    ru: {
      title:
        'Новая сила в цепочке аварийно-спасательного оборудования: Hunan Yonghe Protection Technology Co., Ltd. официально учреждена',
      excerpt:
        'Hunan Yonghe Protection Technology Co., Ltd. официально учреждена, усиливая кооперацию в цепочке аварийно-спасательного оборудования.',
    },
  },
};

function fallbackNewsCopyFor(slug: string, locale: Locale) {
  const localizedCopy = fallbackNewsCopy[slug];

  return localizedCopy?.[locale] ?? localizedCopy?.zh;
}

function fallbackNewsBodyText(slug: string, locale: Locale, excerpt: string) {
  return (legacySeededNewsSummaries[slug]?.[locale] ?? excerpt) || newsBodyFallback[locale];
}

function getFallbackNews(locale: Locale): NewsItem[] {
  return fallbackNewsItems.map((item) => {
    const copy = fallbackNewsCopyFor(item.slug, locale);
    const title = copy?.title ?? item.slug;
    const excerpt = copy?.excerpt ?? title;
    const category = categoryLabels.news?.[locale] ?? '公司新闻';
    const bodyText = fallbackNewsBodyText(item.slug, locale, excerpt);

    return {
      author: '永霏集团',
      category,
      content: [{ text: bodyText, type: 'paragraph' }],
      ...(item.dateModified ? { dateModified: item.dateModified } : {}),
      datePublished: item.datePublished,
      excerpt,
      image: item.image || fallbackNewsImage,
      slug: item.slug,
      title,
    };
  });
}

function getFallbackNewsBySlug(locale: Locale, slug: string) {
  return getFallbackNews(locale).find((item) => item.slug === slug) ?? null;
}

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
  try {
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
      .map((item) => modernizeLegacySeededNewsCopy(mapCmsNews(item, locale), locale))
      .filter((item) => item.slug);

    return !draft && items.length === 0 ? getFallbackNews(locale) : items;
  } catch (error) {
    if (draft) {
      throw error;
    }

    console.warn('[news] failed to load CMS news; using static fallback news', { error });
    return getFallbackNews(locale);
  }
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
  try {
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

    return item
      ? modernizeLegacySeededNewsCopy(mapCmsNews(item, locale), locale)
      : draft
        ? null
        : getFallbackNewsBySlug(locale, slug);
  } catch (error) {
    if (draft) {
      throw error;
    }

    console.warn('[news] failed to load CMS news detail; using static fallback news', {
      error,
      slug,
    });
    return getFallbackNewsBySlug(locale, slug);
  }
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

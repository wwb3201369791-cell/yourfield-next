import type { Locale } from '@/lib/i18n/locale';
import type { LocalizedText } from '@/lib/mock/products';

export type NewsItem = Readonly<{
  slug: string;
  categoryKey: string;
  dateKey: string;
  titleKey: string;
  excerptKey: string;
  image: string;
}>;

export const newsItems: readonly NewsItem[] = [
  {
    slug: 'may-day-safety-inspection',
    categoryKey: 'page.news.companyCategory',
    dateKey: 'page.news.companyDate',
    titleKey: 'page.news.companyTitle',
    excerptKey: 'page.news.companyText',
    image: '/images/news-placeholder.svg',
  },
  {
    slug: 'hunan-labor-award-publicity',
    categoryKey: 'page.news.productsCategory',
    dateKey: 'page.news.productsDate',
    titleKey: 'page.news.productsTitle',
    excerptKey: 'page.news.productsText',
    image: '/images/news-placeholder.svg',
  },
  {
    slug: 'yonghe-protection-established',
    categoryKey: 'page.news.contactCategory',
    dateKey: 'page.news.contactDate',
    titleKey: 'page.news.contactTitle',
    excerptKey: 'page.news.contactText',
    image: '/images/news-placeholder.svg',
  },
  {
    slug: 'advanced-emergency-equipment-catalog',
    categoryKey: 'page.news.channel4Type',
    dateKey: 'page.news.channel4Type',
    titleKey: 'page.news.channel4Title',
    excerptKey: 'page.news.channel4Text',
    image: '/images/news-placeholder.svg',
  },
  {
    slug: 'provincial-technology-platform',
    categoryKey: 'page.news.channel5Type',
    dateKey: 'page.news.channel5Type',
    titleKey: 'page.news.channel5Title',
    excerptKey: 'page.news.channel5Text',
    image: '/images/news-placeholder.svg',
  },
  {
    slug: 'li-wenhui-hunan-entrepreneur',
    categoryKey: 'page.news.channel6Type',
    dateKey: 'page.news.channel6Type',
    titleKey: 'page.news.channel6Title',
    excerptKey: 'page.news.channel6Text',
    image: '/images/news-placeholder.svg',
  },
  {
    slug: 'strategy-seminar-2026',
    categoryKey: 'page.news.channel7Type',
    dateKey: 'page.news.channel7Type',
    titleKey: 'page.news.channel7Title',
    excerptKey: 'page.news.channel7Text',
    image: '/images/news-placeholder.svg',
  },
  {
    slug: 'textile-brand-cultivation',
    categoryKey: 'page.news.channel8Type',
    dateKey: 'page.news.channel8Type',
    titleKey: 'page.news.channel8Title',
    excerptKey: 'page.news.channel8Text',
    image: '/images/news-placeholder.svg',
  },
];

export const newsBodyFallback: LocalizedText = {
  zh: '新闻正文和媒体素材将在客户确认后发布。当前页面先保留标题、摘要、返回入口和 SEO 结构，便于后续从 Payload 替换真实内容。',
  en: 'The full article and media assets will be published after client confirmation. This page keeps the title, summary, return path, and SEO structure ready for Payload content.',
  ru: 'Полный текст новости и медиа будут опубликованы после подтверждения. Страница сохраняет структуру для последующей замены данными Payload.',
};

export function getNewsBySlug(slug: string) {
  return newsItems.find((item) => item.slug === slug) ?? null;
}

export function newsUrl(locale: Locale, slug: string) {
  return `/${locale}/news/${slug}`;
}

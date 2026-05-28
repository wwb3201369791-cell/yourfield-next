import type { Locale } from '@/lib/i18n/locale';
import type { LocalizedText } from '@/lib/mock/products';

export type NewsItem = Readonly<{
  slug: string;
  categoryKey: string;
  dateKey: string;
  titleKey: string;
  excerptKey: string;
  image: string;
  datePublished: string;
  dateModified?: string;
}>;

export const newsItems: readonly NewsItem[] = [
  {
    slug: 'may-day-safety-inspection',
    categoryKey: 'page.news.companyCategory',
    dateKey: 'page.news.companyDate',
    titleKey: 'page.news.companyTitle',
    excerptKey: 'page.news.companyText',
    image: '/images/news-placeholder.svg',
    datePublished: '2026-05-01',
  },
  {
    slug: 'hunan-labor-award-publicity',
    categoryKey: 'page.news.productsCategory',
    dateKey: 'page.news.productsDate',
    titleKey: 'page.news.productsTitle',
    excerptKey: 'page.news.productsText',
    image: '/images/news-placeholder.svg',
    datePublished: '2026-04-30',
  },
  {
    slug: 'yonghe-protection-established',
    categoryKey: 'page.news.contactCategory',
    dateKey: 'page.news.contactDate',
    titleKey: 'page.news.contactTitle',
    excerptKey: 'page.news.contactText',
    image: '/images/news-placeholder.svg',
    datePublished: '2026-01-22',
  },
  {
    slug: 'advanced-emergency-equipment-catalog',
    categoryKey: 'page.news.channel4Type',
    dateKey: 'page.news.channel4Type',
    titleKey: 'page.news.channel4Title',
    excerptKey: 'page.news.channel4Text',
    image: '/images/news-placeholder.svg',
    datePublished: '2026-01-01',
  },
  {
    slug: 'provincial-technology-platform',
    categoryKey: 'page.news.channel5Type',
    dateKey: 'page.news.channel5Type',
    titleKey: 'page.news.channel5Title',
    excerptKey: 'page.news.channel5Text',
    image: '/images/news-placeholder.svg',
    datePublished: '2026-01-01',
  },
  {
    slug: 'li-wenhui-hunan-entrepreneur',
    categoryKey: 'page.news.channel6Type',
    dateKey: 'page.news.channel6Type',
    titleKey: 'page.news.channel6Title',
    excerptKey: 'page.news.channel6Text',
    image: '/images/news-placeholder.svg',
    datePublished: '2025-12-01',
  },
  {
    slug: 'strategy-seminar-2026',
    categoryKey: 'page.news.channel7Type',
    dateKey: 'page.news.channel7Type',
    titleKey: 'page.news.channel7Title',
    excerptKey: 'page.news.channel7Text',
    image: '/images/news-placeholder.svg',
    datePublished: '2025-12-01',
  },
  {
    slug: 'textile-brand-cultivation',
    categoryKey: 'page.news.channel8Type',
    dateKey: 'page.news.channel8Type',
    titleKey: 'page.news.channel8Title',
    excerptKey: 'page.news.channel8Text',
    image: '/images/news-placeholder.svg',
    datePublished: '2025-12-01',
  },
];

export const newsBodyFallback: LocalizedText = {
  zh: '围绕公司动态、产品进展与合作成果，持续记录永霏在安全防护领域的实践与创新。',
  en: "Explore company updates, product progress, and cooperation milestones from YourField's ongoing work in safety protection.",
  ru: 'Новости компании, развитие продуктов и партнерские проекты YourField в сфере промышленной безопасности.',
};

export function getNewsBySlug(slug: string) {
  return newsItems.find((item) => item.slug === slug) ?? null;
}

export function newsUrl(locale: Locale, slug: string) {
  return `/${locale}/news/${slug}`;
}

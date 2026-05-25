import type { Payload } from 'payload';

import { localized, splitLocalizedData, type SeedOptions, type SeedResult } from './lib/shared';
import { upsertCollection } from './lib/upsert';

const pages = [
  { pageKey: 'home', slug: '', title: localized('首页', 'Home', 'Главная') },
  { pageKey: 'about', slug: 'about', title: localized('关于我们', 'About Us', 'О нас') },
  { pageKey: 'products-index', slug: 'products', title: localized('产品中心', 'Products', 'Продукция') },
  { pageKey: 'solutions', slug: 'solutions', title: localized('解决方案', 'Solutions', 'Решения') },
  { pageKey: 'news-index', slug: 'news', title: localized('新闻中心', 'News', 'Новости') },
  { pageKey: 'franchise', slug: 'franchise', title: localized('招商合作', 'Franchise', 'Франчайзинг') },
  { pageKey: 'contact', slug: 'contact', title: localized('联系我们', 'Contact', 'Контакты') },
  { pageKey: 'privacy', slug: 'privacy', title: localized('隐私政策', 'Privacy Policy', 'Политика конфиденциальности') },
  { pageKey: 'cookies', slug: 'cookies', title: localized('Cookie 政策', 'Cookie Policy', 'Политика Cookie') },
  { pageKey: 'terms', slug: 'terms', title: localized('服务条款', 'Terms of Service', 'Условия использования') },
] as const;

export const importLegacyPages = async (payload: Payload, options: SeedOptions): Promise<SeedResult> => {
  const result: SeedResult = { created: 0, updated: 0, skipped: 0 };

  for (const page of pages) {
    const data = {
      pageKey: page.pageKey,
      title: page.title,
      slug: page.slug,
      hero: {
        enabled: true,
        variant: 'image-bg',
        title: page.title,
      },
      blocks: [],
      seo: {
        title: page.title,
        description: page.title,
        noindex: page.pageKey === 'privacy' || page.pageKey === 'cookies' || page.pageKey === 'terms',
      },
      publishedAt: new Date().toISOString(),
      _status: 'published',
    };
    const { zhData, localizedData } = splitLocalizedData(data);

    const upserted = await upsertCollection({
      collection: 'pages',
      data: zhData,
      localizedData,
      payload,
      uniqueField: 'pageKey',
      uniqueValue: page.pageKey,
      options,
    });

    result.created += upserted.created;
    result.updated += upserted.updated;
    result.skipped += upserted.skipped;
  }

  return result;
};

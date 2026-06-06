import type { Payload } from 'payload';

import { localized, splitLocalizedData, type SeedOptions, type SeedResult } from './lib/shared';
import { upsertCollection } from './lib/upsert';

export const legacyPages = [
  {
    pageKey: 'home',
    slug: '',
    title: localized('首页', 'Home', 'Главная'),
    seoDescription: localized(
      '永霏防护展示专业个人防护装备、行业解决方案与企业服务能力，覆盖消防救援、电气作业、工业安全等场景。',
      'Explore YourField Safety protective equipment, industry solutions, and company capabilities for fire rescue, electrical work, and industrial safety.',
      'Изучите защитное оборудование YourField Safety, отраслевые решения и возможности компании для пожарно-спасательных, электротехнических и промышленных задач.',
    ),
  },
  {
    pageKey: 'about',
    slug: 'about',
    title: localized('关于我们', 'About Us', 'О нас'),
    seoDescription: localized(
      '了解永霏防护的发展历程、制造能力、质量体系与安全防护行业服务经验。',
      "Learn about YourField Safety's manufacturing capabilities, quality system, development history, and PPE industry experience.",
      'Узнайте о производственных возможностях, системе качества, истории развития и опыте YourField Safety в сфере СИЗ.',
    ),
  },
  {
    pageKey: 'products-index',
    slug: 'products',
    title: localized('产品中心', 'Products', 'Продукция'),
    seoDescription: localized(
      '浏览永霏防护消防救援、电气绝缘、焊接热工、化学医用等个人防护装备产品目录与应用信息。',
      'Browse YourField Safety PPE for fire rescue, electrical insulation, welding and heat work, chemical protection, medical protection, and related applications.',
      'Просмотрите каталог СИЗ YourField Safety для пожарно-спасательных работ, электроизоляции, сварки, химической и медицинской защиты.',
    ),
  },
  {
    pageKey: 'solutions',
    slug: 'solutions',
    title: localized('解决方案', 'Solutions', 'Решения'),
    seoDescription: localized(
      '查看永霏防护面向电力、冶金、装备制造、电子信息、石化应急等行业的安全防护解决方案。',
      'Review YourField Safety protection solutions for power, metallurgy, equipment manufacturing, electronics, petrochemical, and emergency response industries.',
      'Ознакомьтесь с решениями YourField Safety для энергетики, металлургии, машиностроения, электроники, нефтехимии и аварийно-спасательных служб.',
    ),
  },
  {
    pageKey: 'news-index',
    slug: 'news',
    title: localized('新闻中心', 'News', 'Новости'),
    seoDescription: localized(
      '关注永霏防护企业动态、行业协作、荣誉资质、产品应用案例与安全防护资讯。',
      'Follow YourField Safety company news, industry cooperation, certifications, product application stories, and protective equipment updates.',
      'Следите за новостями YourField Safety, отраслевым сотрудничеством, сертификатами, примерами применения продукции и обновлениями по СИЗ.',
    ),
  },
  {
    pageKey: 'franchise',
    slug: 'franchise',
    title: localized('招商加盟', 'Franchise Partnership', 'Партнерство и франчайзинг'),
    seoDescription: localized(
      '了解永霏防护招商加盟与渠道合作机会，提交合作需求并获取产品、区域与服务支持。',
      'Learn about YourField Safety franchise and channel partnership opportunities, then submit cooperation needs for product, regional, and service support.',
      'Узнайте о возможностях франчайзинга и каналов продаж YourField Safety и отправьте заявку на продуктовую, региональную и сервисную поддержку.',
    ),
  },
  {
    pageKey: 'contact',
    slug: 'contact',
    title: localized('联系我们', 'Contact', 'Контакты'),
    seoDescription: localized(
      '联系永霏防护获取产品咨询、方案建议、招商合作和售后服务支持。',
      'Contact YourField Safety for product consultation, solution recommendations, partnership inquiries, and after-sales support.',
      'Свяжитесь с YourField Safety для консультаций по продукции, рекомендаций по решениям, партнерских запросов и послепродажной поддержки.',
    ),
  },
  {
    pageKey: 'privacy',
    slug: 'privacy',
    title: localized('隐私政策', 'Privacy Policy', 'Политика конфиденциальности'),
    seoDescription: localized(
      '阅读永霏防护关于个人信息收集、使用、存储与保护方式的隐私政策说明。',
      'Read how YourField Safety collects, uses, stores, and protects personal information across website services.',
      'Прочитайте, как YourField Safety собирает, использует, хранит и защищает персональные данные при работе с сайтом.',
    ),
  },
  {
    pageKey: 'cookies',
    slug: 'cookies',
    title: localized('Cookie 政策', 'Cookie Policy', 'Политика Cookie'),
    seoDescription: localized(
      '了解永霏防护网站 Cookie、分析工具与访问体验相关技术的使用方式。',
      'Learn how YourField Safety uses cookies, analytics, and related technologies to support website functionality and experience.',
      'Узнайте, как YourField Safety использует Cookie, аналитику и связанные технологии для работы сайта и улучшения опыта.',
    ),
  },
  {
    pageKey: 'terms',
    slug: 'terms',
    title: localized('服务条款', 'Terms of Service', 'Условия использования'),
    seoDescription: localized(
      '查看永霏防护网站访问、内容使用、咨询提交与服务责任相关条款。',
      'Review the terms governing YourField Safety website access, content use, inquiry submission, and service responsibilities.',
      'Ознакомьтесь с условиями доступа к сайту YourField Safety, использования материалов, отправки запросов и ответственности сервиса.',
    ),
  },
] as const;

export const importLegacyPages = async (
  payload: Payload,
  options: SeedOptions,
): Promise<SeedResult> => {
  const result: SeedResult = { created: 0, updated: 0, skipped: 0 };

  for (const page of legacyPages) {
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
        description: page.seoDescription,
        noindex:
          page.pageKey === 'privacy' || page.pageKey === 'cookies' || page.pageKey === 'terms',
      },
      publishedAt: new Date().toISOString(),
      _status: 'published',
    };
    const { zhData, localizedData } = splitLocalizedData({
      ...data,
      _status: 'draft',
    });

    const upserted = await upsertCollection({
      collection: 'pages',
      data: zhData,
      localizedData,
      payload,
      uniqueField: 'pageKey',
      uniqueValue: page.pageKey,
      options,
    });

    if (!options.skipExisting) {
      await payload.update({
        collection: 'pages',
        data: { _status: 'published' },
        depth: 0,
        id: upserted.id,
        locale: 'zh',
        overrideAccess: true,
      });
    }

    result.created += upserted.created;
    result.updated += upserted.updated;
    result.skipped += upserted.skipped;
  }

  return result;
};

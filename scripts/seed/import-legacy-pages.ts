import type { Payload } from 'payload';

import { localized, splitLocalizedData, type SeedOptions, type SeedResult } from './lib/shared';
import { upsertCollection } from './lib/upsert';

export const coreSeoPageKeys = [
  'home',
  'about',
  'products-index',
  'solutions',
  'news-index',
  'franchise',
  'contact',
] as const;

export const legacyPages = [
  {
    pageKey: 'home',
    slug: '',
    title: localized('首页', 'Home', 'Главная'),
    seoTitle: localized(
      '特种防护装备与个人防护用品制造商',
      'PPE and Protective Clothing Manufacturer',
      'Производитель средств индивидуальной защиты',
    ),
    seoDescription: localized(
      '永霏防护专注特种防护装备与个人防护用品研发制造，产品覆盖防电弧服、阻燃服、消防防护服、防静电服、化学防护服、水域救援服等场景，为电力、石化、冶金、应急救援、医疗等行业提供安全防护解决方案。',
      'YourField Safety manufactures PPE and protective clothing, including arc flash, flame-resistant, firefighting, anti-static, chemical protection, and water rescue gear for industrial safety.',
      'YourField Safety производит профессиональные СИЗ и защитную одежду для энергетики, нефтехимии, металлургии, пожарно-спасательных служб, медицины и промышленной безопасности.',
    ),
    seoKeywords: localized(
      '永霏防护,永霏集团,湖南永霏,特种防护装备,个人防护用品,防电弧服,阻燃服',
      'YourField Safety,PPE manufacturer,protective clothing,arc flash clothing,flame resistant clothing,firefighting protection,chemical protection',
      'YourField Safety,средства индивидуальной защиты,защитная одежда,огнестойкая одежда,защита от дуги,пожарная защита,химическая защита',
    ),
  },
  {
    pageKey: 'about',
    slug: 'about',
    title: localized('关于我们', 'About Us', 'О нас'),
    seoTitle: localized(
      '企业实力、制造能力与质量体系',
      'Company Capabilities and Quality System',
      'Производственные возможности и система качества',
    ),
    seoDescription: localized(
      '了解永霏防护的发展历程、研发制造能力、检测与质量管理体系，以及面向电力、石化、冶金、应急救援等行业的特种防护装备服务经验。',
      'Learn about YourField Safety manufacturing capabilities, R&D, quality management, testing resources, and PPE service experience for power, petrochemical, metallurgy, and emergency response industries.',
      'Узнайте о производстве, НИОКР, контроле качества и опыте YourField Safety в поставках СИЗ для энергетики, нефтехимии, металлургии и спасательных служб.',
    ),
    seoKeywords: localized(
      '永霏防护,永霏集团,湖南永霏,防护装备制造商,质量体系,特种防护装备',
      'YourField Safety,PPE manufacturer,protective clothing manufacturer,quality system,R&D,industrial safety',
      'YourField Safety,производитель СИЗ,защитная одежда,система качества,промышленная безопасность',
    ),
  },
  {
    pageKey: 'products-index',
    slug: 'products',
    title: localized('产品中心', 'Products', 'Продукция'),
    seoTitle: localized(
      '产品中心｜防电弧服、阻燃服与消防防护服',
      'Products | Arc Flash, Flame Resistant and Firefighting PPE',
      'Продукция | СИЗ от дуги, огня и пожарной опасности',
    ),
    seoDescription: localized(
      '浏览永霏防护个人防护装备产品目录，涵盖防电弧服、阻燃服、消防防护服、防静电服、化学防护服、水域救援服等品类与应用信息。',
      'Browse YourField Safety PPE products, including arc flash clothing, flame-resistant garments, firefighting protection, anti-static workwear, chemical protection, and water rescue gear.',
      'Просмотрите продукцию YourField Safety: одежду от электрической дуги, огнестойкую одежду, пожарную, антистатическую, химическую защиту и снаряжение для спасения на воде.',
    ),
    seoKeywords: localized(
      '防电弧服,阻燃服,消防防护服,防静电服,化学防护服,水域救援服,个人防护装备',
      'arc flash clothing,flame resistant clothing,firefighting PPE,anti-static workwear,chemical protection,water rescue gear,PPE products',
      'одежда от дуги,огнестойкая одежда,пожарная защита,антистатическая одежда,химическая защита,спасение на воде,СИЗ',
    ),
  },
  {
    pageKey: 'solutions',
    slug: 'solutions',
    title: localized('解决方案', 'Solutions', 'Решения'),
    seoTitle: localized(
      '行业安全防护解决方案',
      'Industrial Safety Protection Solutions',
      'Решения для промышленной безопасности',
    ),
    seoDescription: localized(
      '查看永霏防护面向电力、石化、冶金、装备制造、电子信息、消防应急和水域救援等行业的个人防护装备配置与安全防护解决方案。',
      'Explore YourField Safety PPE solutions for power utilities, petrochemical, metallurgy, equipment manufacturing, electronics, fire emergency response, and water rescue applications.',
      'Изучите решения YourField Safety по СИЗ для энергетики, нефтехимии, металлургии, машиностроения, электроники, пожарных и спасательных задач на воде.',
    ),
    seoKeywords: localized(
      '安全防护解决方案,行业防护方案,电力防护,石化防护,冶金防护,应急救援防护,个人防护装备',
      'PPE solutions,industrial safety solutions,power utility PPE,petrochemical protection,metallurgy safety,emergency rescue PPE,protective clothing',
      'решения по СИЗ,промышленная безопасность,защита в энергетике,нефтехимическая защита,металлургия,аварийно-спасательная защита',
    ),
  },
  {
    pageKey: 'news-index',
    slug: 'news',
    title: localized('新闻中心', 'News', 'Новости'),
    seoTitle: localized(
      '新闻中心与安全防护资讯',
      'News and Protective Equipment Insights',
      'Новости и материалы по защитному оборудованию',
    ),
    seoDescription: localized(
      '关注永霏防护企业动态、行业协作、荣誉资质、产品应用案例和安全防护资讯，了解特种防护装备与个人防护用品行业最新信息。',
      'Follow YourField Safety company news, industry cooperation, certifications, product application stories, and updates about protective equipment and PPE industry trends.',
      'Следите за новостями YourField Safety, отраслевым сотрудничеством, сертификатами, примерами применения продукции и тенденциями рынка СИЗ.',
    ),
    seoKeywords: localized(
      '永霏防护新闻,安全防护资讯,防护装备案例,个人防护用品行业,特种防护装备,企业动态',
      'YourField Safety news,PPE news,protective equipment insights,industry cooperation,certifications,protective clothing cases',
      'новости YourField Safety,новости СИЗ,защитное оборудование,сертификаты,отраслевое сотрудничество,кейсы защитной одежды',
    ),
  },
  {
    pageKey: 'franchise',
    slug: 'franchise',
    title: localized('招商加盟', 'Franchise Partnership', 'Партнерство и франчайзинг'),
    seoTitle: localized(
      '招商加盟与渠道合作',
      'Franchise and Channel Partnership',
      'Партнерство, дистрибуция и франчайзинг',
    ),
    seoDescription: localized(
      '了解永霏防护招商加盟、区域代理和渠道合作机会，获取特种防护装备产品支持、市场支持、培训支持与售后服务支持。',
      'Learn about YourField Safety franchise, distribution, and channel partnership opportunities with product, regional market, training, and after-sales service support.',
      'Узнайте о франчайзинге, дистрибуции и партнерстве с YourField Safety, включая продуктовую, региональную, учебную и сервисную поддержку.',
    ),
    seoKeywords: localized(
      '永霏防护招商,防护用品代理,渠道合作,区域代理,特种防护装备加盟,个人防护用品合作',
      'YourField partnership,PPE distributor,protective clothing franchise,channel partnership,regional agent,PPE business cooperation',
      'партнерство YourField,дистрибьютор СИЗ,франчайзинг защитной одежды,канальное партнерство,региональный агент',
    ),
  },
  {
    pageKey: 'contact',
    slug: 'contact',
    title: localized('联系我们', 'Contact', 'Контакты'),
    seoTitle: localized(
      '联系我们｜产品咨询、方案建议与售后支持',
      'Contact | Product Consultation and Service Support',
      'Контакты | Консультации и сервисная поддержка',
    ),
    seoDescription: localized(
      '联系永霏防护获取个人防护装备产品咨询、行业方案建议、招商合作、样品需求和售后服务支持，欢迎通过电话、邮箱或在线表单留言。',
      'Contact YourField Safety for PPE product consultation, solution recommendations, partnership inquiries, sample requests, and after-sales service support by phone, email, or online form.',
      'Свяжитесь с YourField Safety для консультаций по СИЗ, рекомендаций по решениям, партнерских запросов, образцов и сервисной поддержки по телефону, email или форме.',
    ),
    seoKeywords: localized(
      '联系永霏防护,防护用品咨询,防护装备报价,方案咨询,招商合作,售后服务,样品需求',
      'contact YourField Safety,PPE consultation,protective clothing quote,solution inquiry,partnership inquiry,after-sales support,sample request',
      'контакты YourField Safety,консультация по СИЗ,запрос цены,партнерство,сервисная поддержка,образцы',
    ),
  },
  {
    pageKey: 'privacy',
    slug: 'privacy',
    title: localized('隐私政策', 'Privacy Policy', 'Политика конфиденциальности'),
    seoTitle: localized('隐私政策', 'Privacy Policy', 'Политика конфиденциальности'),
    seoDescription: localized(
      '阅读永霏防护关于个人信息收集、使用、存储与保护方式的隐私政策说明。',
      'Read how YourField Safety collects, uses, stores, and protects personal information across website services.',
      'Прочитайте, как YourField Safety собирает, использует, хранит и защищает персональные данные при работе с сайтом.',
    ),
    seoKeywords: localized(
      '永霏防护隐私政策,个人信息保护,网站隐私说明',
      'YourField Safety privacy policy,personal data protection,website privacy',
      'политика конфиденциальности YourField Safety,защита данных,персональные данные',
    ),
  },
  {
    pageKey: 'cookies',
    slug: 'cookies',
    title: localized('Cookie 政策', 'Cookie Policy', 'Политика Cookie'),
    seoTitle: localized('Cookie 政策', 'Cookie Policy', 'Политика Cookie'),
    seoDescription: localized(
      '了解永霏防护网站 Cookie、分析工具与访问体验相关技术的使用方式。',
      'Learn how YourField Safety uses cookies, analytics, and related technologies to support website functionality and experience.',
      'Узнайте, как YourField Safety использует Cookie, аналитику и связанные технологии для работы сайта и улучшения опыта.',
    ),
    seoKeywords: localized(
      '永霏防护Cookie政策,Cookie说明,网站分析工具',
      'YourField Safety cookie policy,cookies,website analytics',
      'политика Cookie YourField Safety,Cookie,веб-аналитика',
    ),
  },
  {
    pageKey: 'terms',
    slug: 'terms',
    title: localized('服务条款', 'Terms of Service', 'Условия использования'),
    seoTitle: localized('服务条款', 'Terms of Service', 'Условия использования'),
    seoDescription: localized(
      '查看永霏防护网站访问、内容使用、咨询提交与服务责任相关条款。',
      'Review the terms governing YourField Safety website access, content use, inquiry submission, and service responsibilities.',
      'Ознакомьтесь с условиями доступа к сайту YourField Safety, использования материалов, отправки запросов и ответственности сервиса.',
    ),
    seoKeywords: localized(
      '永霏防护服务条款,网站使用条款,咨询提交条款',
      'YourField Safety terms of service,website terms,inquiry terms',
      'условия использования YourField Safety,условия сайта,запросы',
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
        title: page.seoTitle,
        description: page.seoDescription,
        keywords: page.seoKeywords,
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

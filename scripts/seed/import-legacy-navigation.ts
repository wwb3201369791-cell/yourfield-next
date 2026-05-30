import type { Payload } from 'payload';

import type { Locale, LocalizedString, SeedOptions, SeedResult } from './lib/shared';
import { localized, splitLocalizedData } from './lib/shared';
import { upsertGlobal } from './lib/upsert';

type NavSeedItem = {
  label: LocalizedString;
  href: string;
  target: '_self';
  children: NavSeedItem[];
};
type FooterNavSeedGroup = {
  heading: LocalizedString;
  items: NavSeedItem[];
};
type NavigationSeedData = {
  mainNav: NavSeedItem[];
  mobileNav: NavSeedItem[];
  footerNav: FooterNavSeedGroup[];
};
type NavDocItem = {
  id?: string | number;
  children?: NavDocItem[];
};
type FooterNavDocGroup = {
  id?: string | number;
  items?: NavDocItem[];
};
type NavigationDoc = {
  mainNav?: NavDocItem[];
  mobileNav?: NavDocItem[];
  footerNav?: FooterNavDocGroup[];
};
type LocalizedNavItemData = {
  id?: string;
  label: string;
  href: string;
  target: '_self';
  children: LocalizedNavItemData[];
};
type LocalizedFooterNavData = {
  id?: string;
  heading: string;
  items: LocalizedNavItemData[];
};
type LocalizedNavigationData = {
  mainNav: LocalizedNavItemData[];
  mobileNav: LocalizedNavItemData[];
  footerNav: LocalizedFooterNavData[];
};

const nonDefaultLocales = ['en', 'ru'] as const satisfies ReadonlyArray<Exclude<Locale, 'zh'>>;

const navItem = (
  label: LocalizedString,
  href: string,
  children: NavSeedItem[] = [],
): NavSeedItem => ({
  label,
  href,
  target: '_self',
  children,
});

const withRowId = (doc?: { id?: string | number }) => (doc?.id ? { id: String(doc.id) } : {});

const navItemForLocale = (
  item: NavSeedItem,
  locale: Exclude<Locale, 'zh'>,
  existing?: NavDocItem,
): LocalizedNavItemData => ({
  ...withRowId(existing),
  label: item.label[locale],
  href: item.href,
  target: item.target,
  children: item.children.map((child, index) =>
    navItemForLocale(child, locale, existing?.children?.[index]),
  ),
});

const navigationForLocale = (
  data: NavigationSeedData,
  locale: Exclude<Locale, 'zh'>,
  existing: NavigationDoc,
): LocalizedNavigationData => ({
  mainNav: data.mainNav.map((item, index) =>
    navItemForLocale(item, locale, existing.mainNav?.[index]),
  ),
  mobileNav: data.mobileNav.map((item, index) =>
    navItemForLocale(item, locale, existing.mobileNav?.[index]),
  ),
  footerNav: data.footerNav.map((group, index) => {
    const existingGroup = existing.footerNav?.[index];

    return {
      ...withRowId(existingGroup),
      heading: group.heading[locale],
      items: group.items.map((item, itemIndex) =>
        navItemForLocale(item, locale, existingGroup?.items?.[itemIndex]),
      ),
    };
  }),
});

const updateLocalizedNavigation = async (payload: Payload, data: NavigationSeedData) => {
  const existing = (await payload.findGlobal({
    slug: 'navigation',
    depth: 0,
    locale: 'zh',
    overrideAccess: true,
  })) as NavigationDoc;

  for (const locale of nonDefaultLocales) {
    await payload.updateGlobal({
      slug: 'navigation',
      data: navigationForLocale(data, locale, existing),
      depth: 0,
      locale,
      overrideAccess: true,
    });
  }
};

export const importLegacyNavigation = async (
  payload: Payload,
  options: SeedOptions,
): Promise<SeedResult> => {
  const productChildren = [
    navItem(
      localized('消防救援', 'Fire & Rescue', 'Пожарно-спасательная защита'),
      '/products#fire-rescue',
    ),
    navItem(
      localized('电力防护', 'Electrical Protection', 'Электрозащита'),
      '/products#electrical-protection',
    ),
    navItem(
      localized('热防护与焊接', 'Thermal & Welding', 'Теплозащита и сварка'),
      '/products#thermal-welding',
    ),
    navItem(
      localized('化工医疗', 'Chemical & Medical', 'Химическая и медицинская защита'),
      '/products#chemical-medical',
    ),
    navItem(
      localized('水域救援防护', 'Water Rescue Protection', 'Защита для спасения на воде'),
      '/products#water-rescue',
    ),
  ];

  const mainNav = [
    navItem(localized('首页', 'Home', 'Главная'), '/'),
    navItem(localized('关于我们', 'About Us', 'О нас'), '/about'),
    navItem(localized('产品中心', 'Products', 'Продукция'), '/products', productChildren),
    navItem(localized('解决方案', 'Solutions', 'Решения'), '/solutions'),
    navItem(localized('新闻中心', 'News', 'Новости'), '/news'),
    navItem(localized('招商加盟', 'Franchise Partnership', 'Партнерство'), '/franchise'),
    navItem(localized('联系我们', 'Contact', 'Контакты'), '/contact'),
  ];

  const data: NavigationSeedData = {
    mainNav,
    mobileNav: mainNav,
    footerNav: [
      {
        heading: localized('公司', 'Company', 'Компания'),
        items: [mainNav[1]!, mainNav[3]!, mainNav[5]!, mainNav[6]!],
      },
      {
        heading: localized('产品', 'Products', 'Продукция'),
        items: productChildren,
      },
      {
        heading: localized('合规', 'Compliance', 'Правовая информация'),
        items: [
          navItem(
            localized('隐私政策', 'Privacy Policy', 'Политика конфиденциальности'),
            '/privacy',
          ),
          navItem(localized('Cookie 政策', 'Cookie Policy', 'Политика Cookie'), '/cookies'),
          navItem(localized('服务条款', 'Terms of Service', 'Условия использования'), '/terms'),
        ],
      },
    ],
  };
  const { zhData } = splitLocalizedData(data);

  const result = await upsertGlobal({
    global: 'navigation',
    payload,
    options,
    data: zhData,
    isSeeded: (doc) => Array.isArray(doc.mainNav) && doc.mainNav.length > 0,
  });

  if (!result.skipped) {
    await updateLocalizedNavigation(payload, data);
  }

  return result;
};

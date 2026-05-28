import type { Payload } from 'payload';

import type { SeedOptions, SeedResult } from './lib/shared';
import { localized, splitLocalizedData } from './lib/shared';
import { upsertGlobal } from './lib/upsert';

type MediaManifest = Map<string, number>;

export const importLegacySiteSettings = async (
  payload: Payload,
  options: SeedOptions,
  mediaManifest: MediaManifest,
): Promise<SeedResult> => {
  const logoLight = mediaManifest.get('assets/images/brand/yourfield-logo-official-a.png');
  const logoDark =
    mediaManifest.get('assets/images/brand/yourfield-logo-official-b.png') || logoLight;

  if (!logoLight || !logoDark) {
    throw new Error('Missing seeded brand media for SiteSettings logo/favicon');
  }

  const data = {
    siteName: localized('永霏集团', 'YourField Group', 'YourField Group'),
    tagline: localized(
      '特种防护装备制造商',
      'Protective equipment manufacturer',
      'Производитель защитного снаряжения',
    ),
    logo: {
      light: logoLight,
      dark: logoDark,
    },
    favicon: logoLight,
    appleTouchIcon: logoLight,
    themeColor: '#1e3a5f',
    contact: {
      phone: '400-6800181',
      email: 'hnyf@yourfield.net',
      address: localized(
        '湖南湘潭高新区创业东路1号',
        'No. 1 Chuangye East Road, Xiangtan High-tech Zone, Hunan',
        '№1, Chuangye East Road, Xiangtan High-tech Zone, Hunan',
      ),
      businessHours: localized(
        '周一至周五 09:00-18:00',
        'Monday-Friday 09:00-18:00',
        'Понедельник-пятница 09:00-18:00',
      ),
    },
    coordinates: {
      lat: 27.816329,
      lng: 112.989066,
      zoom: 15,
    },
    socials: [],
    icp: '湘ICP备18013725号-1',
    defaultSeo: {
      title: localized('永霏集团', 'YourField Group', 'YourField Group'),
      description: localized(
        '永霏集团特种防护装备官方网站。',
        'Official website of YourField Group protective equipment.',
        'Официальный сайт защитного снаряжения YourField Group.',
      ),
      keywords: localized(
        '永霏,防护服,消防服',
        'YourField,protective clothing,firefighter suit',
        'YourField,защитная одежда,пожарный костюм',
      ),
      noindex: false,
    },
    mapServiceByLocale: [
      { locale: 'zh', service: 'amap' },
      { locale: 'en', service: 'google' },
      { locale: 'ru', service: 'google' },
    ],
    cookieConsent: {
      enabled: true,
      title: localized('我们使用 cookies', 'We use cookies', 'Мы используем cookies'),
      description: localized(
        'Cookie 仅用于记住你选择的网站语言。网站会记录必要的匿名访问量，帮助后台了解访问情况，不用于广告追踪。',
        'Cookies are only used to remember your selected site language. The website records necessary anonymous visit counts for admin traffic insight and does not use advertising tracking.',
        'Cookie используются только для запоминания выбранного языка сайта. Сайт записывает необходимое анонимное число посещений для админ-статистики и не использует рекламное отслеживание.',
      ),
      acceptLabel: localized('知道了', 'Got it', 'Понятно'),
      rejectLabel: localized('管理语言', 'Manage language', 'Управлять языком'),
      essentialOnlyLabel: localized(
        '仅语言偏好',
        'Language preference only',
        'Только языковые настройки',
      ),
    },
    analytics: {
      enabled: false,
    },
  };
  const { zhData, localizedData } = splitLocalizedData(data);

  return upsertGlobal({
    global: 'site-settings',
    payload,
    options,
    data: zhData,
    localizedData,
    isSeeded: (doc) => {
      const logo = doc.logo as { light?: unknown } | undefined;
      return Boolean(doc.siteName && logo?.light && doc.favicon);
    },
  });
};

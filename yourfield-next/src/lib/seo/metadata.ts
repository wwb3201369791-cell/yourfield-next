import type { Metadata } from 'next';

import { env } from '@/lib/env';
import type { Locale } from '@/lib/i18n/locale';

const siteNameByLocale: Record<Locale, string> = {
  zh: '永霏防护',
  en: 'YourField Group',
  ru: 'YourField Group',
};

const hreflangByLocale: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en',
  ru: 'ru',
};

export function siteName(locale: Locale) {
  return siteNameByLocale[locale];
}

export function absoluteUrl(path: string) {
  return new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();
}

export function localizedPath(locale: Locale, path: string) {
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

type BuildPageMetadataArgs = Readonly<{
  locale: Locale;
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
}>;

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  image = '/images/hero-poster.jpg',
  type = 'website',
}: BuildPageMetadataArgs): Metadata {
  const url = absoluteUrl(localizedPath(locale, path));
  const imageUrl = absoluteUrl(image);

  return {
    title: `${title} | ${siteName(locale)}`,
    description,
    alternates: {
      canonical: url,
      languages: {
        [hreflangByLocale.zh]: absoluteUrl(localizedPath('zh', path)),
        [hreflangByLocale.en]: absoluteUrl(localizedPath('en', path)),
        [hreflangByLocale.ru]: absoluteUrl(localizedPath('ru', path)),
        'x-default': absoluteUrl(localizedPath('zh', path)),
      },
    },
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: siteName(locale),
      locale: locale === 'zh' ? 'zh_CN' : locale === 'ru' ? 'ru_RU' : 'en_US',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

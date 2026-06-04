import type { Metadata } from 'next';

import { env } from '@/lib/env';
import type { Locale } from '@/lib/i18n/locale';

const siteNameByLocale: Record<Locale, string> = {
  zh: '永霏防护',
  en: 'YourField Group',
  ru: 'YourField Group',
};

const ogLocaleByLocale: Record<Locale, string> = {
  zh: 'zh_CN',
  en: 'en_US',
  ru: 'ru_RU',
};

export const hreflangByLocale: Record<Locale, string> = {
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

function buildLanguageAlternates(path: string) {
  return {
    [hreflangByLocale.zh]: absoluteUrl(localizedPath('zh', path)),
    [hreflangByLocale.en]: absoluteUrl(localizedPath('en', path)),
    [hreflangByLocale.ru]: absoluteUrl(localizedPath('ru', path)),
    'ru-RU': absoluteUrl(localizedPath('ru', path)),
    'x-default': absoluteUrl(localizedPath('zh', path)),
  };
}

type BuildPageMetadataArgs = Readonly<{
  locale: Locale;
  path: string;
  title: string;
  description: string;
  image?: string | undefined;
  imageAlt?: string | undefined;
  keywords?: readonly string[] | undefined;
  noIndex?: boolean | undefined;
  type?: 'website' | 'article' | undefined;
}>;

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  image,
  imageAlt = title,
  keywords,
  noIndex = false,
  type = 'website',
}: BuildPageMetadataArgs): Metadata {
  const url = absoluteUrl(localizedPath(locale, path));
  const metadataImage = typeof image === 'string' ? image.trim() : '';
  const imageUrl = metadataImage ? absoluteUrl(metadataImage) : '';
  const fullTitle = `${siteName(locale)} | ${title}`;
  const alternateOgLocales = Object.entries(ogLocaleByLocale)
    .filter(([alternateLocale]) => alternateLocale !== locale)
    .map(([, ogLocale]) => ogLocale);

  const metadata: Metadata = {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      type,
      url,
      title: fullTitle,
      description,
      siteName: siteName(locale),
      locale: ogLocaleByLocale[locale],
      alternateLocale: alternateOgLocales,
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }] } : {}),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: fullTitle,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };

  if (keywords && keywords.length > 0) {
    metadata.keywords = [...keywords];
  }

  return metadata;
}

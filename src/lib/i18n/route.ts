import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { isLocale } from '@/lib/i18n/locale';

export type LocaleRouteParams = Promise<{
  locale: string;
}>;

export type LocaleSlugRouteParams = Promise<{
  locale: string;
  slug: string;
}>;

export function resolveRouteLocale(locale: string) {
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return locale;
}

export async function resolveRouteLocaleFromParams(params: LocaleRouteParams) {
  const { locale } = await params;

  return resolveRouteLocale(locale);
}

export async function resolveRouteLocaleAndSlug(params: LocaleSlugRouteParams) {
  const { locale, slug } = await params;

  return {
    locale: resolveRouteLocale(locale),
    slug,
  };
}

import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { isLocale } from '@/lib/i18n/locale';

export function resolveRouteLocale(locale: string) {
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return locale;
}

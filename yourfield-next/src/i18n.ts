import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

import { isLocale } from '@/lib/i18n/locale';
import { expandFlatMessages } from '@/lib/i18n/messages';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = (await import(`../messages/${locale}.json`)).default as Record<string, string>;

  return {
    locale,
    messages: expandFlatMessages(messages),
  };
});

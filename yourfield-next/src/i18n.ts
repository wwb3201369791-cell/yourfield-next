import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

import { getMessagesForLocale } from '@/lib/i18n/getMessages';
import { isLocale } from '@/lib/i18n/locale';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!isLocale(locale)) {
    notFound();
  }

  return {
    locale,
    messages: getMessagesForLocale(locale),
  };
});

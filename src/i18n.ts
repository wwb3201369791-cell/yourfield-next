import { getRequestConfig } from 'next-intl/server';

import { getMessagesForLocale } from '@/lib/i18n/getMessages';
import { defaultLocale, isLocale } from '@/lib/i18n/locale';

export function resolveRequestLocale(locale: string | undefined) {
  return isLocale(locale) ? locale : defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = resolveRequestLocale(await requestLocale);

  return {
    locale,
    messages: getMessagesForLocale(locale),
  };
});

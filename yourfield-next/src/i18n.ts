import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

import { isLocale, type Locale } from '@/lib/i18n/locale';
import { expandFlatMessages } from '@/lib/i18n/messages';

import enMessages from '../messages/en.json';
import ruMessages from '../messages/ru.json';
import zhMessages from '../messages/zh.json';

const flatMessagesByLocale = {
  en: enMessages,
  ru: ruMessages,
  zh: zhMessages,
} satisfies Record<Locale, Record<string, string>>;

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!isLocale(locale)) {
    notFound();
  }

  return {
    locale,
    messages: expandFlatMessages(flatMessagesByLocale[locale]),
  };
});

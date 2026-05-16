import type { Formats, TranslationValues } from 'next-intl';
import { getTranslations as getNextIntlTranslations } from 'next-intl/server';

import type { Locale } from '@/lib/i18n/locale';
import { normalizeMessageKey } from '@/lib/i18n/messages';

export async function getTranslations(locale: Locale) {
  const translate = await getNextIntlTranslations({ locale });

  return (key: string, values?: TranslationValues, formats?: Formats) =>
    translate(normalizeMessageKey(key), values, formats);
}

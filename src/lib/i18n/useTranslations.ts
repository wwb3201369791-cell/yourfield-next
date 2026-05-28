'use client';

import { useTranslations as useNextIntlTranslations } from 'next-intl';
import type { Formats, TranslationValues } from 'next-intl';

import { normalizeMessageKey } from '@/lib/i18n/messages';

export function useTranslations() {
  const translate = useNextIntlTranslations();

  return (key: string, values?: TranslationValues, formats?: Formats) =>
    translate(normalizeMessageKey(key), values, formats);
}

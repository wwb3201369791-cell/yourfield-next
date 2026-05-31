import type { Locale } from '@/lib/i18n/locale';

import { localized, type LocalizedText } from './types';

export const hanTextPattern = /[\u3400-\u9fff]/u;

export function containsHanText(value: string) {
  return hanTextPattern.test(value);
}

export function publicLocaleText(value: string, locale: Locale) {
  const text = value.trim();

  if (locale === 'zh') {
    return text;
  }

  return containsHanText(text) ? '' : text;
}

export function localizedPublicText(value: LocalizedText, locale: Locale) {
  return publicLocaleText(localized(value, locale), locale);
}

import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { Locale } from '@/lib/i18n/locale';
import { locales } from '@/lib/i18n/locale';
import { createNextIntlMessages, type FlatMessages } from '@/lib/i18n/messages';

const messagesDirectory = path.join(process.cwd(), 'messages');
const flatMessagesByLocale = Object.fromEntries(
  locales.map((locale) => [
    locale,
    JSON.parse(
      readFileSync(path.join(messagesDirectory, `${locale}.json`), 'utf8'),
    ) as FlatMessages,
  ]),
) as Record<Locale, FlatMessages>;

export function getFlatMessages(locale: Locale) {
  return flatMessagesByLocale[locale];
}

export function getMessagesForLocale(locale: Locale) {
  return createNextIntlMessages(getFlatMessages(locale));
}

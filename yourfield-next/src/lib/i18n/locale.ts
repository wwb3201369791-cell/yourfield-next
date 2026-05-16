import { env } from '@/lib/env';

export const locales = env.NEXT_PUBLIC_LOCALES;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = env.NEXT_PUBLIC_DEFAULT_LOCALE;

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

import type { Locale } from '@/lib/i18n/locale';

const productEditorLocales = ['zh', 'en', 'ru'] as const satisfies readonly Locale[];

type ResolveProductEditorContentLocaleArgs = Readonly<{
  payloadLocaleCode?: string | null | undefined;
  queryLocale?: string | null | undefined;
}>;

function asProductEditorLocale(value: string | null | undefined): Locale | null {
  return productEditorLocales.includes(value as Locale) ? (value as Locale) : null;
}

export function productEditorContentLocaleFromSearch(
  search: string | null | undefined,
): Locale | null {
  if (!search) {
    return null;
  }

  return asProductEditorLocale(new URLSearchParams(search).get('locale'));
}

export function resolveProductEditorContentLocale({
  payloadLocaleCode,
  queryLocale,
}: ResolveProductEditorContentLocaleArgs): Locale {
  return asProductEditorLocale(queryLocale) ?? asProductEditorLocale(payloadLocaleCode) ?? 'zh';
}

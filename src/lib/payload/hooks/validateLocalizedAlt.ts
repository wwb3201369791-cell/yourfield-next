import type { CollectionBeforeValidateHook as BeforeValidateHook } from 'payload';

type LocalizedText = {
  en?: string;
  ru?: string;
  zh?: string;
};

type MediaData = {
  alt?: LocalizedText | string;
  filename?: string;
  id: string;
};

const hasText = (value: string | undefined) => typeof value === 'string' && value.trim().length > 0;
const localizedAltLocales = ['zh', 'en', 'ru'] as const;

type LocalizedAltLocale = (typeof localizedAltLocales)[number];

function cleanFileName(fileName: string | undefined) {
  const name = (fileName ?? '')
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return name || '';
}

function requestLocale(locale: null | string | undefined): LocalizedAltLocale {
  return localizedAltLocales.find((code) => code === locale) ?? 'zh';
}

function firstLocalizedText(alt: LocalizedText, locale: LocalizedAltLocale) {
  return [alt[locale], alt.zh, alt.en, alt.ru].find(hasText);
}

function defaultLocalizedAlt(data: Partial<MediaData> | undefined): string | undefined {
  const fileName = cleanFileName(data?.filename);

  if (!fileName) {
    return undefined;
  }

  return fileName.includes('产品图片') ? fileName : `${fileName} 产品图片`;
}

export const validateLocalizedAlt: BeforeValidateHook<MediaData> = ({ data, req }) => {
  const alt = data?.alt;
  const locale = requestLocale(req?.locale);
  const fallbackAlt = defaultLocalizedAlt(data);

  if (typeof alt === 'string') {
    if (!hasText(alt)) {
      if (fallbackAlt) {
        return { ...data, alt: fallbackAlt };
      }

      throw new Error('alt 必须填写。');
    }

    return data;
  }

  const localizedAlt = alt ? firstLocalizedText(alt, locale) : undefined;

  if (!localizedAlt) {
    if (fallbackAlt) {
      return {
        ...data,
        alt: fallbackAlt,
      };
    }

    throw new Error('alt 必须填写。');
  }

  return {
    ...data,
    alt: localizedAlt,
  };
};

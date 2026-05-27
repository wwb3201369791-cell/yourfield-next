import type { BeforeValidateHook } from 'payload/dist/collections/config/types';

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

function cleanFileName(fileName: string | undefined) {
  const name = (fileName ?? '')
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return name || '';
}

function defaultLocalizedAlt(data: Partial<MediaData> | undefined): LocalizedText | undefined {
  const fileName = cleanFileName(data?.filename);

  if (!fileName) {
    return undefined;
  }

  const alt = fileName.includes('产品图片') ? fileName : `${fileName} 产品图片`;

  return {
    en: alt,
    ru: alt,
    zh: alt,
  };
}

export const validateLocalizedAlt: BeforeValidateHook<MediaData> = ({ data }) => {
  const alt = data?.alt;
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

  if (!alt || !hasText(alt.zh) || !hasText(alt.en) || !hasText(alt.ru)) {
    if (fallbackAlt) {
      const existingAlt = alt ?? {};

      return {
        ...data,
        alt: {
          en: hasText(existingAlt.en) ? existingAlt.en : fallbackAlt.en,
          ru: hasText(existingAlt.ru) ? existingAlt.ru : fallbackAlt.ru,
          zh: hasText(existingAlt.zh) ? existingAlt.zh : fallbackAlt.zh,
        },
      };
    }

    throw new Error('alt 必须三语全填（zh / en / ru）。');
  }

  return data;
};

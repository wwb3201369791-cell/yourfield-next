import path from 'path';

export const projectRoot = path.resolve(process.cwd(), '..');
export const appRoot = process.cwd();

export type Locale = 'zh' | 'en' | 'ru';
export type LocalizedString = Record<Locale, string>;
export type LocalizedData = Record<Exclude<Locale, 'zh'>, Record<string, unknown>>;

const locales = ['zh', 'en', 'ru'] as const;

export type SeedOptions = {
  skipExisting: boolean;
};

export type SeedResult = {
  created: number;
  updated: number;
  skipped: number;
};

export const emptyResult = (): SeedResult => ({
  created: 0,
  updated: 0,
  skipped: 0,
});

export const addResult = (target: SeedResult, source: SeedResult) => {
  target.created += source.created;
  target.updated += source.updated;
  target.skipped += source.skipped;
};

export const localized = (zh: string, en: string, ru: string): LocalizedString => ({ zh, en, ru });

export const localizedFrom = (value: Partial<LocalizedString> | string, fallback: string): LocalizedString => {
  if (typeof value === 'string') {
    return localized(value, value, value);
  }

  return localized(value.zh || fallback, value.en || value.zh || fallback, value.ru || value.en || value.zh || fallback);
};

export const textRows = (values: readonly string[] | undefined) =>
  (values || []).filter(Boolean).map((value) => ({ value }));

export const localizedTextRows = (values: readonly string[] | Partial<LocalizedString> | undefined) => {
  if (!values) {
    return [];
  }

  if (Array.isArray(values)) {
    return values.filter(Boolean).map((value) => ({ value }));
  }

  const row = localizedFrom(values as Partial<LocalizedString>, '');
  return row.zh ? [{ value: row }] : [];
};

export type LexicalRichText = {
  root: {
    children: Array<{
      children: Array<{
        detail: number;
        format: number;
        mode: 'normal';
        style: string;
        text: string;
        type: 'text';
        version: number;
      }>;
      direction: null;
      format: '';
      indent: number;
      type: 'paragraph';
      version: number;
    }>;
    direction: null;
    format: '';
    indent: number;
    type: 'root';
    version: number;
  };
};

export const richTextFromPlainText = (text: string): LexicalRichText => {
  const value = text || '';

  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: value,
              type: 'text',
              version: 1,
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };
};

export const localizedRichTextFromPlainText = (text: LocalizedString): Record<Locale, LexicalRichText> => ({
  zh: richTextFromPlainText(text.zh),
  en: richTextFromPlainText(text.en),
  ru: richTextFromPlainText(text.ru),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isLocalizedRecord = (value: unknown): value is Record<Locale, unknown> =>
  isRecord(value) && locales.every((locale) => locale in value);

const splitValueByLocale = (value: unknown): Record<Locale, unknown> => {
  if (isLocalizedRecord(value)) {
    return {
      zh: value.zh,
      en: value.en ?? value.zh,
      ru: value.ru ?? value.en ?? value.zh,
    };
  }

  if (Array.isArray(value)) {
    const splitItems = value.map((item) => splitValueByLocale(item));
    return {
      zh: splitItems.map((item) => item.zh),
      en: splitItems.map((item) => item.en),
      ru: splitItems.map((item) => item.ru),
    };
  }

  if (isRecord(value)) {
    const splitObject: Record<Locale, Record<string, unknown>> = {
      zh: {},
      en: {},
      ru: {},
    };

    for (const [key, childValue] of Object.entries(value)) {
      const splitChild = splitValueByLocale(childValue);
      for (const locale of locales) {
        splitObject[locale][key] = splitChild[locale];
      }
    }

    return splitObject;
  }

  return {
    zh: value,
    en: value,
    ru: value,
  };
};

export const splitLocalizedData = (data: Record<string, unknown>) => {
  const split = splitValueByLocale(data) as Record<Locale, Record<string, unknown>>;

  return {
    zhData: split.zh,
    localizedData: {
      en: split.en,
      ru: split.ru,
    } satisfies LocalizedData,
  };
};

export const splitLocalizedMediaData = (data: Record<string, unknown>) => {
  const { zhData, localizedData } = splitLocalizedData(data);

  return {
    zhData,
    localizedData,
  };
};

export const parseSeedOptions = (): SeedOptions => ({
  skipExisting: process.argv.includes('--skip-existing'),
});

import type { FieldHook } from 'payload';
import { pinyin } from 'pinyin-pro';

const sourcePriorityFields = ['productId', 'categoryId', 'pageKey'] as const;
const localizedSourceFields = ['title', 'name', 'question'] as const;
const localePriority = ['zh', 'en', 'ru'] as const;
const chineseTextPattern = /[㐀-鿿豈-﫿]+/gu;
const combiningMarkPattern = /[̀-ͯ]/g;

const stringFromValue = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
};

const localizedString = (value: unknown): string | undefined => {
  const directValue = stringFromValue(value);
  if (directValue) {
    return directValue;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const locale of localePriority) {
      const localizedValue = stringFromValue(record[locale]);
      if (localizedValue) {
        return localizedValue;
      }
    }
  }

  return undefined;
};

const transliterateChinese = (value: string) =>
  value.replace(chineseTextPattern, (segment) =>
    pinyin(segment, { toneType: 'none', type: 'array', v: 'v' }).join(' '),
  );

const toSlug = (value: string) =>
  transliterateChinese(value)
    .normalize('NFKD')
    .replace(combiningMarkPattern, '')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

const sourceFromRecord = (record: Record<string, unknown> | undefined): string | undefined => {
  if (!record) {
    return undefined;
  }

  for (const fieldName of sourcePriorityFields) {
    const value = localizedString(record[fieldName]);
    if (value) {
      return value;
    }
  }

  for (const fieldName of localizedSourceFields) {
    const value = localizedString(record[fieldName]);
    if (value) {
      return value;
    }
  }

  return undefined;
};

const isHomePageRecord = (record: Record<string, unknown> | undefined) =>
  localizedString(record?.pageKey) === 'home';

export const generateSlug: FieldHook = ({ data, siblingData, value }) => {
  const record = (siblingData ?? data) as Record<string, unknown> | undefined;

  if (typeof value === 'string' && value.trim()) {
    return toSlug(value);
  }

  if (isHomePageRecord(record)) {
    return '';
  }

  const source = sourceFromRecord(record);

  if (!source) {
    if (typeof value === 'string') {
      return value;
    }

    return undefined;
  }

  return toSlug(source);
};

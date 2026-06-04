import type { FormState as Fields } from 'payload';
import { reduceFieldsToValues } from 'payload/shared';

import {
  cloneValue,
  isRecord,
  isSpecComplete,
  type CheckSpec,
  type RequiredI18nPath,
} from '@/lib/i18n/i18nCompleteness';
import { adminUiText } from '@/lib/payload/adminText';

export const localeOrder = ['zh', 'en', 'ru'] as const;

const localeCodeSet = new Set<string>(localeOrder);

export type ContentLocale = (typeof localeOrder)[number];

export type LocaleSummary = Readonly<{
  code: ContentLocale;
  completed: number;
  missingLabels: readonly string[];
  total: number;
}>;

export const localeLabels: Record<ContentLocale, string> = {
  zh: '中文',
  en: '英文',
  ru: '俄文',
};

export function asContentLocale(value: unknown): ContentLocale {
  return typeof value === 'string' && localeCodeSet.has(value) ? (value as ContentLocale) : 'zh';
}

export function formValuesForI18nSummary(fields: Fields) {
  return reduceFieldsToValues(fields, true) as Record<string, unknown>;
}

function localizedValue(value: unknown, locale: ContentLocale): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => localizedValue(item, locale));
  }

  if (!isRecord(value)) {
    return cloneValue(value);
  }

  if (Object.keys(value).some((key) => localeCodeSet.has(key))) {
    return cloneValue(value[locale]);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, localizedValue(nestedValue, locale)]),
  );
}

function docForLocale(doc: Record<string, unknown> | undefined, locale: ContentLocale) {
  const localized = localizedValue(doc ?? {}, locale);
  return isRecord(localized) ? localized : {};
}

function labelForPath(path: RequiredI18nPath) {
  return adminUiText('zh', path.label).trim() || path.path;
}

export function requiredLabelSummary(
  paths: readonly RequiredI18nPath[],
  translate: (label: string) => string = (label) => label,
  separator = '、',
) {
  return Array.from(new Set(paths.map((path) => translate(labelForPath(path))))).join(separator);
}

function specsFromRequiredPaths(paths: readonly RequiredI18nPath[]) {
  const normalizedPaths = new Set(paths.map((item) => item.path));

  return paths.map((item): CheckSpec & { label: string } => {
    const hasChildSpec = Array.from(normalizedPaths).some((candidate) =>
      candidate.startsWith(`${item.path}.`),
    );

    return {
      kind: hasChildSpec ? 'array' : 'value',
      label: labelForPath(item),
      path: item.path.split('.').filter(Boolean),
    };
  });
}

function hasMeaningfulSummaryValue(value: unknown): boolean {
  if (typeof value === 'undefined' || value === null) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulSummaryValue(item));
  }

  if (isRecord(value)) {
    const textValue = value['text'];
    if (typeof textValue === 'string') {
      return textValue.trim().length > 0;
    }

    return Object.entries(value).some(([key, nestedValue]) => {
      if (
        key === 'id' ||
        key.startsWith('_') ||
        key === 'type' ||
        key === 'version' ||
        key === 'format' ||
        key === 'indent' ||
        key === 'direction' ||
        key === 'textFormat' ||
        key === 'textStyle'
      ) {
        return false;
      }

      return hasMeaningfulSummaryValue(nestedValue);
    });
  }

  return true;
}

function mergeCurrentLocaleForSummary(base: unknown, incoming: unknown): unknown {
  if (!hasMeaningfulSummaryValue(incoming)) {
    return cloneValue(base);
  }

  if (Array.isArray(incoming)) {
    return cloneValue(incoming);
  }

  if (isRecord(base) && isRecord(incoming)) {
    const merged: Record<string, unknown> = { ...cloneValue(base) };

    for (const [key, value] of Object.entries(incoming)) {
      merged[key] = mergeCurrentLocaleForSummary(merged[key], value);
    }

    return merged;
  }

  return cloneValue(incoming);
}

export function collectLocaleSummaries(args: {
  currentLocale: ContentLocale;
  currentValues: Record<string, unknown>;
  doc: Record<string, unknown> | undefined;
  requiredPaths: readonly RequiredI18nPath[];
}) {
  const specs = specsFromRequiredPaths(args.requiredPaths);
  const total = new Set(specs.map((spec) => spec.label)).size;

  return localeOrder.map((locale): LocaleSummary => {
    const savedDoc = docForLocale(args.doc, locale);
    const currentLocaleValues = docForLocale(args.currentValues, args.currentLocale);
    const localeDoc =
      locale === args.currentLocale
        ? (mergeCurrentLocaleForSummary(savedDoc, currentLocaleValues) as Record<string, unknown>)
        : savedDoc;
    const missingLabels = Array.from(
      new Set(specs.filter((spec) => !isSpecComplete(localeDoc, spec)).map((spec) => spec.label)),
    );

    return {
      code: locale,
      completed: Math.max(total - missingLabels.length, 0),
      missingLabels,
      total,
    };
  });
}

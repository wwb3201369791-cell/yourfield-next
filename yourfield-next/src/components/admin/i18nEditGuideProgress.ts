import reduceFieldsToValues from 'payload/dist/admin/components/forms/Form/reduceFieldsToValues';
import type { Fields } from 'payload/dist/admin/components/forms/Form/types';

import {
  cloneValue,
  isRecord,
  isSpecComplete,
  mergeDefined,
  type CheckSpec,
  type RequiredI18nPath,
} from '@/lib/i18n/i18nCompleteness';

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
  return path.label?.trim() || path.path;
}

export function requiredLabelSummary(paths: readonly RequiredI18nPath[]) {
  return Array.from(new Set(paths.map(labelForPath))).join('、');
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
    const localeDoc =
      locale === args.currentLocale
        ? (mergeDefined(savedDoc, args.currentValues) as Record<string, unknown>)
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

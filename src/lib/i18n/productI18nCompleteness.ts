import {
  requiredProductI18nPaths,
  type RequiredProductI18nPath,
} from '../product/productI18nRequirements';

import {
  cloneValue,
  isRecord,
  isSpecComplete,
  mergeDefined,
  type CheckSpec,
} from './i18nCompleteness';

export type ProductI18nLocale = 'zh' | 'en' | 'ru';

export type ProductI18nMissingItem = Readonly<{
  group: string;
  label: string;
  path: string;
  section: ProductEditorSection;
}>;

export type ProductEditorSection =
  | 'hero'
  | 'intro'
  | 'selling-points'
  | 'specifications'
  | 'size-guide'
  | 'scenarios'
  | 'visual-groups'
  | 'evidence'
  | 'care'
  | 'faq'
  | 'identity';

export type ProductLocaleCompleteness = Readonly<{
  code: ProductI18nLocale;
  completed: number;
  missing: readonly ProductI18nMissingItem[];
  total: number;
}>;

export type ProductI18nCompleteness = Readonly<{
  locales: Record<ProductI18nLocale, ProductLocaleCompleteness>;
  total: number;
}>;

type CompletenessArgs = Readonly<{
  currentLocale?: ProductI18nLocale;
  currentValues?: Record<string, unknown>;
  doc?: Record<string, unknown>;
  locales?: readonly ProductI18nLocale[];
  paths?: readonly RequiredProductI18nPath[];
}>;

const localeCodes = ['zh', 'en', 'ru'] as const satisfies readonly ProductI18nLocale[];
const localeKeySet = new Set<string>(localeCodes);

const sectionByGroup: Record<string, ProductEditorSection> = {
  applications: 'scenarios',
  careInstructions: 'care',
  description: 'hero',
  features: 'intro',
  materials: 'intro',
  name: 'hero',
  qualityEvidence: 'evidence',
  scenarios: 'scenarios',
  sellingPoints: 'selling-points',
  sizeGuide: 'size-guide',
  specifications: 'specifications',
  visualGroups: 'visual-groups',
};

function groupForPath(path: string) {
  return path.split('.')[0] || path;
}

export function productEditorSectionForI18nPath(path: string): ProductEditorSection {
  return sectionByGroup[groupForPath(path)] ?? 'identity';
}

function localizedValue(value: unknown, locale: ProductI18nLocale): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => localizedValue(item, locale));
  }

  if (!isRecord(value)) {
    return cloneValue(value);
  }

  if (Object.keys(value).some((key) => localeKeySet.has(key))) {
    return cloneValue(value[locale]);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, localizedValue(nestedValue, locale)]),
  );
}

function docForLocale(doc: Record<string, unknown> | undefined, locale: ProductI18nLocale) {
  const localized = localizedValue(doc ?? {}, locale);
  return isRecord(localized) ? localized : {};
}

function specsFromRequiredPaths(paths: readonly RequiredProductI18nPath[]) {
  const normalizedPaths = new Set(paths.map((item) => item.path));

  return paths.map(
    (item): CheckSpec & { group: string; originalPath: string; section: ProductEditorSection } => {
      const hasChildSpec = Array.from(normalizedPaths).some((candidate) =>
        candidate.startsWith(`${item.path}.`),
      );

      return {
        group: groupForPath(item.path),
        kind: hasChildSpec ? 'array' : 'value',
        label: item.label,
        originalPath: item.path,
        path: item.path.split('.').filter(Boolean),
        section: productEditorSectionForI18nPath(item.path),
      };
    },
  );
}

export function collectProductI18nCompleteness({
  currentLocale = 'zh',
  currentValues = {},
  doc,
  locales = localeCodes,
  paths = requiredProductI18nPaths,
}: CompletenessArgs): ProductI18nCompleteness {
  const specs = specsFromRequiredPaths(paths);
  const groupKeys = Array.from(new Set(specs.map((spec) => spec.group)));
  const total = groupKeys.length;
  const summaries = {} as Record<ProductI18nLocale, ProductLocaleCompleteness>;

  for (const locale of locales) {
    const baseDoc = docForLocale(doc, locale);
    const localeDoc =
      locale === currentLocale
        ? (mergeDefined(baseDoc, currentValues) as Record<string, unknown>)
        : baseDoc;
    const missingSpecs = specs.filter((spec) => !isSpecComplete(localeDoc, spec));
    const missingGroups = new Set(missingSpecs.map((spec) => spec.group));
    const missing = missingSpecs.map((spec) => ({
      group: spec.group,
      label: spec.label,
      path: spec.originalPath,
      section: spec.section,
    }));

    summaries[locale] = {
      code: locale,
      completed: Math.max(total - missingGroups.size, 0),
      missing,
      total,
    };
  }

  return {
    locales: summaries,
    total,
  };
}

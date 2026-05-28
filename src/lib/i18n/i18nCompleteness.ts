import type { Field } from 'payload/types';

export type LocaleCode = string;

export type RequiredI18nPath = Readonly<{
  path: string;
  label?: string;
}>;

export type CheckKind = 'array' | 'value';

export type CheckSpec = Readonly<{
  blockType?: string;
  kind: CheckKind;
  label: string;
  path: readonly string[];
}>;

export type MissingByLocale = Map<LocaleCode, Set<string>>;

export type RequireAllLocalesOptions = Readonly<{
  paths?: readonly (string | RequiredI18nPath)[];
}>;

export const localeLabels: Record<string, string> = {
  zh: '中文版本',
  en: '英文版本',
  ru: '俄文版本',
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function cloneValue<T>(value: T): T {
  if (typeof value === 'undefined' || value === null) {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function mergeDefined(base: unknown, incoming: unknown): unknown {
  if (typeof incoming === 'undefined') {
    return cloneValue(base);
  }

  if (Array.isArray(incoming)) {
    return cloneValue(incoming);
  }

  if (isRecord(base) && isRecord(incoming)) {
    const merged: Record<string, unknown> = { ...cloneValue(base) };

    for (const [key, value] of Object.entries(incoming)) {
      merged[key] = mergeDefined(merged[key], value);
    }

    return merged;
  }

  return cloneValue(incoming);
}

function fieldHasName(field: Field): field is Field & { name: string } {
  return 'name' in field && typeof field.name === 'string';
}

function fieldLabel(field: Field, fallback: string) {
  if ('label' in field && typeof field.label === 'string' && field.label.trim()) {
    return field.label;
  }

  return fallback;
}

export function normalizePath(path: string) {
  return path.replace(/\[\]/g, '').split('.').filter(Boolean).join('.');
}

function pathKey(path: readonly string[], blockType?: string) {
  const normalizedPath = path.join('.');
  return blockType ? `${path.slice(0, -1).join('.')}.${blockType}.${path.at(-1)}` : normalizedPath;
}

function configuredPathMap(paths: RequireAllLocalesOptions['paths']) {
  if (!paths) {
    return undefined;
  }

  return new Map(
    paths.map((path) => {
      const config = typeof path === 'string' ? { path } : path;
      return [normalizePath(config.path), config.label];
    }),
  );
}

function isCheckableValueField(field: Field) {
  return field.type === 'text' || field.type === 'textarea' || field.type === 'richText';
}

function hasLocalizedDescendant(fields: readonly Field[], inheritedLocalized = false): boolean {
  return fields.some((field) => {
    const fieldLocalized = inheritedLocalized || ('localized' in field && field.localized === true);

    if (fieldLocalized && (isCheckableValueField(field) || field.type === 'array')) {
      return true;
    }

    if (field.type === 'group' || field.type === 'array' || field.type === 'row') {
      return hasLocalizedDescendant(field.fields, fieldLocalized);
    }

    if (field.type === 'collapsible') {
      return hasLocalizedDescendant(field.fields, fieldLocalized);
    }

    if (field.type === 'tabs') {
      return field.tabs.some((tab) => hasLocalizedDescendant(tab.fields, fieldLocalized));
    }

    if (field.type === 'blocks') {
      return field.blocks.some((block) => hasLocalizedDescendant(block.fields, fieldLocalized));
    }

    return false;
  });
}

export function collectCheckSpecs(
  fields: readonly Field[],
  parentPath: readonly string[] = [],
  inheritedLocalized = false,
  parentLabel = '',
  blockType?: string,
): CheckSpec[] {
  const specs: CheckSpec[] = [];

  for (const field of fields) {
    const fieldLocalized = inheritedLocalized || ('localized' in field && field.localized === true);

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const tabPath = 'name' in tab && typeof tab.name === 'string' ? [...parentPath, tab.name] : parentPath;
        specs.push(...collectCheckSpecs(tab.fields, tabPath, fieldLocalized, parentLabel, blockType));
      }
      continue;
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      specs.push(...collectCheckSpecs(field.fields, parentPath, fieldLocalized, parentLabel, blockType));
      continue;
    }

    if (!fieldHasName(field)) {
      continue;
    }

    const currentPath = [...parentPath, field.name];
    const currentLabel = fieldLabel(field, parentLabel || currentPath.join('.'));

    if (field.type === 'blocks') {
      for (const block of field.blocks) {
        specs.push(
          ...collectCheckSpecs(block.fields, currentPath, fieldLocalized, currentLabel, block.slug),
        );
      }
      continue;
    }

    if (field.type === 'group') {
      specs.push(...collectCheckSpecs(field.fields, currentPath, fieldLocalized, currentLabel, blockType));
      continue;
    }

    if (field.type === 'array') {
      if (fieldLocalized || hasLocalizedDescendant(field.fields)) {
        specs.push({
          ...(blockType ? { blockType } : {}),
          kind: 'array',
          label: currentLabel,
          path: currentPath,
        });
      }

      specs.push(...collectCheckSpecs(field.fields, currentPath, fieldLocalized, currentLabel, blockType));
      continue;
    }

    if (fieldLocalized && isCheckableValueField(field)) {
      specs.push({
        ...(blockType ? { blockType } : {}),
        kind: 'value',
        label: currentLabel,
        path: currentPath,
      });
    }
  }

  return specs;
}

export function filterSpecs(specs: readonly CheckSpec[], paths: RequireAllLocalesOptions['paths']) {
  const configuredPaths = configuredPathMap(paths);

  if (!configuredPaths) {
    return specs;
  }

  return specs
    .filter((spec) => {
      const directKey = normalizePath(spec.path.join('.'));
      const blockKey = normalizePath(pathKey(spec.path, spec.blockType));
      return configuredPaths.has(directKey) || configuredPaths.has(blockKey);
    })
    .map((spec) => {
      const directKey = normalizePath(spec.path.join('.'));
      const blockKey = normalizePath(pathKey(spec.path, spec.blockType));
      const label = configuredPaths.get(directKey) ?? configuredPaths.get(blockKey) ?? spec.label;

      return {
        ...spec,
        label,
      };
    });
}

function hoistLocalizedField(sibling: Record<string, unknown>, field: Field, locale: LocaleCode) {
  if (!fieldHasName(field) || !('localized' in field) || field.localized !== true) {
    return;
  }

  const localizedValue = sibling[field.name];

  if (isRecord(localizedValue)) {
    sibling[field.name] = cloneValue(localizedValue[locale]);
  }
}

function flattenFieldsForLocale(
  sibling: Record<string, unknown>,
  fields: readonly Field[],
  locale: LocaleCode,
) {
  for (const field of fields) {
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && typeof tab.name === 'string') {
          const tabValue = sibling[tab.name];
          if (isRecord(tabValue)) {
            flattenFieldsForLocale(tabValue, tab.fields, locale);
          }
        } else {
          flattenFieldsForLocale(sibling, tab.fields, locale);
        }
      }
      continue;
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      flattenFieldsForLocale(sibling, field.fields, locale);
      continue;
    }

    if (!fieldHasName(field)) {
      continue;
    }

    hoistLocalizedField(sibling, field, locale);

    const value = sibling[field.name];

    if (field.type === 'group' && isRecord(value)) {
      flattenFieldsForLocale(value, field.fields, locale);
      continue;
    }

    if (field.type === 'array' && Array.isArray(value)) {
      for (const row of value) {
        if (isRecord(row)) {
          flattenFieldsForLocale(row, field.fields, locale);
        }
      }
      continue;
    }

    if (field.type === 'blocks' && Array.isArray(value)) {
      for (const row of value) {
        if (!isRecord(row) || typeof row.blockType !== 'string') {
          continue;
        }

        const block = field.blocks.find((candidate) => candidate.slug === row.blockType);

        if (block) {
          flattenFieldsForLocale(row, block.fields, locale);
        }
      }
    }
  }
}

export function flattenDocumentForLocale(
  doc: Record<string, unknown> | undefined,
  fields: readonly Field[],
  locale: LocaleCode,
) {
  const flattened = cloneValue(doc ?? {});
  flattenFieldsForLocale(flattened, fields, locale);
  return flattened;
}

function valuesAtPath(value: unknown, path: readonly string[], blockType?: string): unknown[] {
  if (path.length === 0) {
    return [value];
  }

  if (Array.isArray(value)) {
    const rows = blockType
      ? value.filter((row) => isRecord(row) && row.blockType === blockType)
      : value;

    return rows.flatMap((row) => valuesAtPath(row, path, blockType));
  }

  if (!isRecord(value)) {
    return [undefined];
  }

  const [segment, ...rest] = path;

  if (!segment) {
    return [undefined];
  }

  return valuesAtPath(value[segment], rest, blockType);
}

function richTextHasText(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => richTextHasText(item));
  }

  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.text === 'string') {
    return value.text.trim().length > 0;
  }

  if (typeof value.textContent === 'string') {
    return value.textContent.trim().length > 0;
  }

  if ('root' in value) {
    return richTextHasText(value.root);
  }

  if (Array.isArray(value.children)) {
    return value.children.some((item) => richTextHasText(item));
  }

  return false;
}

function isCompleteValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (isRecord(value)) {
    if ('root' in value) {
      return richTextHasText(value);
    }

    return Object.keys(value).length > 0;
  }

  return value !== null && typeof value !== 'undefined';
}

export function isSpecComplete(doc: Record<string, unknown>, spec: CheckSpec) {
  const values = valuesAtPath(doc, spec.path, spec.blockType);

  if (values.length === 0) {
    return true;
  }

  if (spec.kind === 'array') {
    return values.every((value) => Array.isArray(value) && value.length > 0);
  }

  return values.every(isCompleteValue);
}

export function collectMissingFields(
  docsByLocale: ReadonlyMap<LocaleCode, Record<string, unknown>>,
  specs: readonly CheckSpec[],
) {
  const missing: MissingByLocale = new Map();

  for (const [locale, doc] of docsByLocale.entries()) {
    for (const spec of specs) {
      if (isSpecComplete(doc, spec)) {
        continue;
      }

      const localeMissing = missing.get(locale) ?? new Set<string>();
      localeMissing.add(spec.label);
      missing.set(locale, localeMissing);
    }
  }

  return missing;
}

export function formatMissingMessage(missing: MissingByLocale) {
  const sections = Array.from(missing.entries()).map(([locale, labels]) => {
    const localeLabel = localeLabels[locale] ?? `${locale} 版本`;
    const fieldLabels = Array.from(labels)
      .map((label) => `【${label}】`)
      .join('');

    return `${localeLabel}缺失${fieldLabels}`;
  });

  return `无法发布：${sections.join('；')}`;
}

export function docsByLocale(args: {
  currentLocale: LocaleCode;
  data: Record<string, unknown>;
  existingAllLocales: Record<string, unknown> | undefined;
  fields: readonly Field[];
  locales: readonly LocaleCode[];
}) {
  const docs = new Map<LocaleCode, Record<string, unknown>>();

  for (const locale of args.locales) {
    const existingLocaleDoc = flattenDocumentForLocale(args.existingAllLocales, args.fields, locale);
    const doc =
      locale === args.currentLocale
        ? (mergeDefined(existingLocaleDoc, args.data) as Record<string, unknown>)
        : existingLocaleDoc;

    docs.set(locale, doc);
  }

  return docs;
}

export function hasMissingFields(missing: MissingByLocale) {
  return Array.from(missing.values()).some((fields) => fields.size > 0);
}

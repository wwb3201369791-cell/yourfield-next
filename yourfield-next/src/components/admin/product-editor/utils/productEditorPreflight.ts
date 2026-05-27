import type {
  ProductI18nCompleteness,
  ProductI18nLocale,
  ProductEditorSection,
} from '@/lib/i18n/productI18nCompleteness';

import type { RequiredError } from './collectRequiredErrors';

const localeOrder = ['zh', 'en', 'ru'] as const satisfies readonly ProductI18nLocale[];

const localeShortLabels: Record<ProductI18nLocale, string> = {
  zh: 'ZH',
  en: 'EN',
  ru: 'RU',
};

const localeLongLabels: Record<ProductI18nLocale, string> = {
  zh: '中文',
  en: '英文',
  ru: '俄文',
};

export type ProductLocaleBadge = Readonly<{
  active: boolean;
  code: ProductI18nLocale;
  completed: number;
  href: string;
  missingCount: number;
  status: 'complete' | 'missing';
  text: string;
  title: string;
  total: number;
}>;

export type PublishPreflightItem = Readonly<{
  group?: string;
  label: string;
  locale: ProductI18nLocale;
  localeLabel: string;
  path: string;
  section: ProductEditorSection;
  source: 'required';
}>;

export type PublishPreflightResult = Readonly<{
  canPublish: boolean;
  firstTarget: PublishPreflightItem | null;
  items: readonly PublishPreflightItem[];
}>;

type BuildLocaleBadgesArgs = Readonly<{
  completeness: ProductI18nCompleteness;
  currentLocale: ProductI18nLocale;
  hrefForLocale: (locale: ProductI18nLocale) => string;
}>;

type PublishPreflightArgs = Readonly<{
  currentLocale: ProductI18nLocale;
  requiredErrors: readonly RequiredError[];
}>;

function asProductSection(section: string): ProductEditorSection {
  const knownSections = new Set<ProductEditorSection>([
    'hero',
    'intro',
    'selling-points',
    'specifications',
    'size-guide',
    'scenarios',
    'visual-groups',
    'evidence',
    'care',
    'faq',
    'identity',
  ]);

  return knownSections.has(section as ProductEditorSection)
    ? (section as ProductEditorSection)
    : 'identity';
}

export function buildLocaleBadges({
  completeness,
  currentLocale,
  hrefForLocale,
}: BuildLocaleBadgesArgs): ProductLocaleBadge[] {
  return localeOrder.map((code) => {
    const localeCompleteness = completeness.locales[code];
    const missingCount = localeCompleteness.missing.length;
    const status = missingCount > 0 ? 'missing' : 'complete';
    const text = `${localeShortLabels[code]} ${localeCompleteness.completed}/${localeCompleteness.total}${missingCount > 0 ? '⚠' : ''}`;
    const missingPreview = localeCompleteness.missing
      .slice(0, 6)
      .map((item) => item.label)
      .join('、');

    return {
      active: code === currentLocale,
      code,
      completed: localeCompleteness.completed,
      href: hrefForLocale(code),
      missingCount,
      status,
      text,
      title:
        missingCount > 0
          ? `${localeLongLabels[code]}缺失：${missingPreview}${missingCount > 6 ? '…' : ''}`
          : `${localeLongLabels[code]}已完成`,
      total: localeCompleteness.total,
    };
  });
}

function fromRequiredError(
  currentLocale: ProductI18nLocale,
  error: RequiredError,
): PublishPreflightItem {
  return {
    label: error.label,
    locale: currentLocale,
    localeLabel: localeLongLabels[currentLocale],
    path: error.path,
    section: asProductSection(error.section),
    source: 'required',
  };
}

export function collectPublishPreflight({
  currentLocale,
  requiredErrors,
}: PublishPreflightArgs): PublishPreflightResult {
  const items: PublishPreflightItem[] = [];

  for (const error of requiredErrors) {
    items.push(fromRequiredError(currentLocale, error));
  }

  return {
    canPublish: items.length === 0,
    firstTarget: items[0] ?? null,
    items,
  };
}

function getPathValue(source: unknown, path: string): unknown {
  if (!path) {
    return source;
  }

  return path.split('.').reduce<unknown>((current, segment) => {
    if (Array.isArray(current)) {
      return current.map((item) => getPathValue(item, segment));
    }

    if (typeof current === 'object' && current !== null && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source);
}

function unwrapChineseLocale(value: unknown): unknown {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    ('zh' in value || 'en' in value || 'ru' in value)
  ) {
    return (value as Record<string, unknown>).zh;
  }

  return value;
}

function richTextToText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(richTextToText).filter(Boolean).join(' ');
  }

  if (typeof value !== 'object' || value === null) {
    return '';
  }

  const record = value as Record<string, unknown>;
  const directText = typeof record.text === 'string' ? record.text : '';
  const rootText = 'root' in record ? richTextToText(record.root) : '';
  const childrenText = Array.isArray(record.children) ? richTextToText(record.children) : '';

  return [directText, rootText, childrenText].filter(Boolean).join(' ');
}

function compactText(value: unknown): string {
  const unwrapped = unwrapChineseLocale(value);

  if (typeof unwrapped === 'string') {
    return unwrapped.trim();
  }

  if (typeof unwrapped === 'number' || typeof unwrapped === 'boolean') {
    return String(unwrapped);
  }

  if (Array.isArray(unwrapped)) {
    return unwrapped.map(compactText).filter(Boolean).join(' / ');
  }

  if (typeof unwrapped !== 'object' || unwrapped === null) {
    return '';
  }

  const record = unwrapped as Record<string, unknown>;

  if ('root' in record || 'children' in record) {
    const richText = richTextToText(record).trim();
    if (richText) {
      return richText;
    }
  }

  const title = compactText(record.title);
  const label = compactText(record.label);
  const fieldValue = compactText(record.value);
  const text = compactText(record.text);
  const description = compactText(record.description);

  if (title && text) {
    return `${title}：${text}`;
  }

  if (label && fieldValue) {
    return `${label}：${fieldValue}`;
  }

  return [title, label, fieldValue, text, description].filter(Boolean).join('：');
}

export function extractChineseOriginalPreview(
  doc: Record<string, unknown> | null | undefined,
  path: string,
) {
  const value = getPathValue(doc ?? {}, path);
  const text = compactText(value).replace(/\s+/g, ' ').trim();

  if (text.length <= 180) {
    return text;
  }

  return `${text.slice(0, 180)}…`;
}

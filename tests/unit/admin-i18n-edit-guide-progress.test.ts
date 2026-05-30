import type { FormField, FormState as Fields } from 'payload';
import { describe, expect, it } from 'vitest';

import {
  collectLocaleSummaries,
  formValuesForI18nSummary,
  requiredLabelSummary,
} from '@/components/admin/i18nEditGuideProgress';

const requiredPaths = [
  { path: 'title', label: '方案标题' },
  { path: 'summary', label: '卡片说明' },
  { path: 'features', label: '方案要点' },
  { path: 'features.value', label: '方案要点' },
  { path: 'productTags', label: '核心产品标签' },
  { path: 'productTags.value', label: '核心产品标签' },
  { path: 'content', label: '详细说明' },
] as const;

function field(value: unknown, options: { disableFormData?: true } = {}): FormField {
  return {
    initialValue: value,
    valid: true,
    value,
    ...options,
  };
}

function richText(text: string) {
  return {
    root: {
      children: [
        {
          children: [{ text }],
          type: 'paragraph',
        },
      ],
      type: 'root',
    },
  };
}

describe('admin i18n edit guide progress', () => {
  it('counts localized array rows from form fields instead of the parent row count', () => {
    const fields: Fields = {
      title: field('Petrochemical'),
      summary: field('PPE configuration for oil and gas.'),
      features: field(2, { disableFormData: true }),
      'features.0.id': field('feature-1'),
      'features.0.value': field('Chemical splash planning'),
      'features.1.id': field('feature-2'),
      'features.1.value': field('Flame and contamination overlap'),
      productTags: field(1, { disableFormData: true }),
      'productTags.0.id': field('tag-1'),
      'productTags.0.value': field('Chemical protective clothing'),
      content: field(richText('Detailed petrochemical solution copy.')),
    };

    const currentValues = formValuesForI18nSummary(fields);
    const summaries = collectLocaleSummaries({
      currentLocale: 'en',
      currentValues,
      doc: {
        title: { zh: '石油石化', en: 'Petrochemical', ru: 'Нефтехимия' },
        summary: {
          zh: '石油石化防护配置。',
          en: 'PPE configuration for oil and gas.',
          ru: 'Комплектация СИЗ для нефти и газа.',
        },
        features: {
          zh: [{ value: '风险识别' }],
          en: [{ value: 'Chemical splash planning' }],
          ru: [{ value: 'Планирование химических рисков' }],
        },
        productTags: {
          zh: [{ value: '防化服' }],
          en: [{ value: 'Chemical protective clothing' }],
          ru: [{ value: 'Химзащитная одежда' }],
        },
        content: {
          zh: richText('中文详细说明。'),
          en: richText('Detailed petrochemical solution copy.'),
          ru: richText('Подробное описание решения.'),
        },
      },
      requiredPaths,
    });

    expect(currentValues.features).toEqual([
      { id: 'feature-1', value: 'Chemical splash planning' },
      { id: 'feature-2', value: 'Flame and contamination overlap' },
    ]);
    expect(currentValues.productTags).toEqual([
      { id: 'tag-1', value: 'Chemical protective clothing' },
    ]);
    expect(summaries.find((summary) => summary.code === 'en')).toMatchObject({
      completed: 5,
      missingLabels: [],
      total: 5,
    });
  });

  it('dedupes nested array checks into the visible five solution progress items', () => {
    expect(requiredLabelSummary(requiredPaths)).toBe(
      '方案标题、卡片说明、方案要点、核心产品标签、详细说明',
    );
  });
});

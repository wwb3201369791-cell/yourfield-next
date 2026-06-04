import { describe, expect, it } from 'vitest';

import { requiredProductI18nPaths } from '@/lib/product/productI18nRequirements';

import { collectProductI18nCompleteness } from '../productI18nCompleteness';

const locales = ['zh', 'en', 'ru'] as const;

describe('product i18n completeness shared checks', () => {
  it('tracks the required product publish groups without optional size guide data', () => {
    const topLevelGroups = new Set(requiredProductI18nPaths.map((item) => item.path.split('.')[0]));

    expect(topLevelGroups).toEqual(
      new Set([
        'name',
        'description',
        'materials',
        'features',
        'sellingPoints',
        'specifications',
        'applications',
        'scenarios',
        'visualGroups',
        'careInstructions',
        'qualityEvidence',
      ]),
    );
    expect(topLevelGroups.size).toBe(11);
    expect(requiredProductI18nPaths.some((item) => item.path.startsWith('sizeGuide'))).toBe(false);
    expect(requiredProductI18nPaths.some((item) => item.path.startsWith('tags'))).toBe(false);
  });

  it('keeps saved current-locale arrays when the visual editor form has empty placeholder rows', () => {
    const summary = collectProductI18nCompleteness({
      currentLocale: 'zh',
      currentValues: {
        applications: [],
        careInstructions: [],
        description: richText(''),
        features: [{ description: '', title: '' }],
        materials: [],
        name: '消防服',
        qualityEvidence: [],
        scenarios: [],
        sellingPoints: [],
        specifications: [],
        visualGroups: [],
      },
      doc: completeProductDoc('zh'),
      locales: ['zh'],
      paths: requiredProductI18nPaths,
    });

    expect(summary.locales.zh.completed).toBe(11);
    expect(summary.locales.zh.missing).toEqual([]);
  });

  it('keeps saved required groups when visual editor rows only contain non-required metadata', () => {
    const summary = collectProductI18nCompleteness({
      currentLocale: 'zh',
      currentValues: {
        applications: [{ icon: 'rescue', id: 'application-placeholder', value: '' }],
        careInstructions: [{ id: 'care-placeholder', value: '', warningLevel: 'low' }],
        description: richText(''),
        features: [{ description: '', icon: 'heat', id: 'feature-placeholder', title: '' }],
        materials: [{ id: 'material-placeholder', kind: 'fabric', value: '' }],
        name: '消防服',
        qualityEvidence: [{ description: '', file: 194, id: 'evidence-placeholder', title: '' }],
        scenarios: [{ description: '', id: 'scenario-placeholder', image: 195, title: '' }],
        sellingPoints: [{ icon: 'light', id: 'selling-point-placeholder', text: '', title: '' }],
        specifications: [{ id: 'spec-placeholder', label: '', unit: 'cm', value: '' }],
        visualGroups: [
          {
            description: '',
            id: 'visual-placeholder',
            images: [196],
            title: '',
            type: 'scene',
          },
        ],
      },
      doc: completeProductDoc('zh'),
      locales: ['zh'],
      paths: requiredProductI18nPaths,
    });

    expect(summary.locales.zh.completed).toBe(11);
    expect(summary.locales.zh.missing).toEqual([]);
  });

  it('still reports incomplete current rows when required i18n fields are partially edited', () => {
    const summary = collectProductI18nCompleteness({
      currentLocale: 'zh',
      currentValues: {
        features: [{ description: '', icon: 'heat', id: 'feature-edit', title: '已编辑标题' }],
      },
      doc: completeProductDoc('zh'),
      locales: ['zh'],
      paths: requiredProductI18nPaths,
    });

    expect(summary.locales.zh.completed).toBe(10);
    expect(summary.locales.zh.missing.map((item) => item.group)).toContain('features');
  });

  it('checks localized arrays and nested localized fields by locale for the admin publish preflight', () => {
    const doc = {
      name: { zh: '消防服', en: 'Fire suit', ru: '' },
      description: { zh: richText('中文介绍'), en: richText('English intro'), ru: richText('') },
      materials: { zh: [{ value: '芳纶' }], en: [], ru: [] },
      features: { zh: [{ title: '阻燃', description: '耐高温' }], en: [], ru: [] },
      sellingPoints: { zh: [{ title: '轻便', text: '说明' }], en: [], ru: [] },
      specifications: [
        {
          label: { zh: '型号', en: 'Model', ru: '' },
          value: { zh: 'A1', en: '', ru: '' },
        },
      ],
      sizeGuide: {
        title: { zh: '尺码', en: 'Size', ru: '' },
        cornerLabel: { zh: '身高', en: '', ru: '' },
        columns: [{ label: { zh: 'M', en: 'M', ru: '' } }],
        rows: [{ label: { zh: '胸围', en: '', ru: '' }, values: [{ value: '100' }] }],
      },
      applications: { zh: [{ value: '灭火救援' }], en: [], ru: [] },
      scenarios: { zh: [{ title: '救援', description: '现场' }], en: [], ru: [] },
      visualGroups: { zh: [{ title: '场景图', description: '展示' }], en: [], ru: [] },
      careInstructions: { zh: [{ value: '阴凉处晾干' }], en: [], ru: [] },
      qualityEvidence: { zh: [{ title: '检测报告', description: '有效' }], en: [], ru: [] },
    };

    const summary = collectProductI18nCompleteness({
      currentLocale: 'en',
      currentValues: {
        materials: [{ value: 'Aramid' }],
        specifications: [{ label: 'Model', value: 'A1' }],
      },
      doc,
      locales,
      paths: requiredProductI18nPaths,
    });

    expect(summary.total).toBe(11);
    expect(summary.locales.zh.completed).toBe(11);
    expect(summary.locales.en.completed).toBeGreaterThan(0);
    expect(summary.locales.en.missing.some((item) => item.path === 'materials')).toBe(false);
    expect(summary.locales.en.missing.some((item) => item.path === 'specifications.value')).toBe(
      false,
    );
    expect(summary.locales.ru.completed).toBe(0);
  });
});

function completeProductDoc(locale: (typeof locales)[number]) {
  return {
    applications: { [locale]: [{ value: '灭火救援' }] },
    careInstructions: { [locale]: [{ value: '阴凉处晾干' }] },
    description: { [locale]: richText('完整产品介绍') },
    features: { [locale]: [{ description: '耐高温', title: '阻燃' }] },
    materials: { [locale]: [{ value: '芳纶' }] },
    name: { [locale]: '消防服' },
    qualityEvidence: { [locale]: [{ description: '有效', title: '检测报告' }] },
    scenarios: { [locale]: [{ description: '现场', title: '救援' }] },
    sellingPoints: { [locale]: [{ text: '说明', title: '轻便' }] },
    specifications: [{ label: { [locale]: '型号' }, value: { [locale]: 'A1' } }],
    visualGroups: { [locale]: [{ description: '展示', title: '场景图' }] },
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

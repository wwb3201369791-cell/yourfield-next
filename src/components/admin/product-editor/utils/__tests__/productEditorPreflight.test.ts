import { describe, expect, it } from 'vitest';

import type { ProductI18nCompleteness } from '@/lib/i18n/productI18nCompleteness';

import {
  buildLocaleBadges,
  collectPublishPreflight,
  extractChineseOriginalPreview,
} from '../productEditorPreflight';

function completeness(
  overrides: Partial<ProductI18nCompleteness['locales']> = {},
): ProductI18nCompleteness {
  return {
    total: 12,
    locales: {
      zh: { code: 'zh', completed: 12, total: 12, missing: [] },
      en: {
        code: 'en',
        completed: 3,
        total: 12,
        missing: [
          { group: 'description', label: '产品介绍', path: 'description', section: 'hero' },
          {
            group: 'sellingPoints',
            label: '卖点标题',
            path: 'sellingPoints.title',
            section: 'selling-points',
          },
        ],
      },
      ru: {
        code: 'ru',
        completed: 0,
        total: 12,
        missing: [{ group: 'name', label: '产品名称', path: 'name', section: 'hero' }],
      },
      ...overrides,
    },
  };
}

describe('product editor preflight helpers', () => {
  it('builds language badges with completion counts, active state, and warning state', () => {
    const badges = buildLocaleBadges({
      completeness: completeness(),
      currentLocale: 'en',
      hrefForLocale: (locale) => `/admin/collections/products/42?locale=${locale}`,
    });

    expect(badges.map((badge) => badge.text)).toEqual(['ZH 12/12', 'EN 3/12⚠', 'RU 0/12⚠']);
    expect(badges.find((badge) => badge.code === 'en')?.active).toBe(true);
    expect(badges.find((badge) => badge.code === 'zh')?.status).toBe('complete');
    expect(badges.find((badge) => badge.code === 'ru')?.status).toBe('missing');
    expect(badges.find((badge) => badge.code === 'ru')?.href).toContain('locale=ru');
  });

  it('blocks publish only when the current form still has required field errors', () => {
    const result = collectPublishPreflight({
      currentLocale: 'en',
      requiredErrors: [{ label: 'Slug 必填', path: 'slug', section: 'identity' }],
    });

    expect(result.canPublish).toBe(false);
    expect(result.items.map((item) => `${item.locale}:${item.label}:${item.section}`)).toEqual([
      'en:Slug 必填:identity',
    ]);
    expect(result.firstTarget).toMatchObject({ locale: 'en', section: 'identity', path: 'slug' });
  });

  it('allows publish even when optional multilingual detail content is incomplete', () => {
    const result = collectPublishPreflight({
      currentLocale: 'zh',
      requiredErrors: [],
    });

    expect(result.canPublish).toBe(true);
    expect(result.items).toEqual([]);
    expect(result.firstTarget).toBeNull();
  });

  it('extracts compact Chinese original previews for localized drawer fields', () => {
    const doc = {
      name: { zh: '消防员灭火防护服', en: 'Fire suit' },
      description: {
        zh: {
          root: {
            type: 'root',
            children: [{ type: 'paragraph', children: [{ text: '中文产品介绍原文。' }] }],
          },
        },
      },
      materials: { zh: [{ value: '芳纶' }, { value: '阻燃纤维' }] },
      sellingPoints: { zh: [{ title: '阻燃隔热', text: '适合高温环境' }] },
    };

    expect(extractChineseOriginalPreview(doc, 'name')).toBe('消防员灭火防护服');
    expect(extractChineseOriginalPreview(doc, 'description')).toBe('中文产品介绍原文。');
    expect(extractChineseOriginalPreview(doc, 'materials')).toBe('芳纶 / 阻燃纤维');
    expect(extractChineseOriginalPreview(doc, 'sellingPoints')).toBe('阻燃隔热：适合高温环境');
  });
});

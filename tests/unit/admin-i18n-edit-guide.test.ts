import type { Field } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { FAQs } from '@/collections/FAQs';
import { FormSubmissions } from '@/collections/FormSubmissions';
import { News } from '@/collections/News';
import { Pages } from '@/collections/Pages';
import { ProductGroups } from '@/collections/ProductGroups';
import { Solutions } from '@/collections/Solutions';
import { SiteSettings } from '@/globals/SiteSettings';

vi.mock('@/components/admin/SiteSettingsEditGate', () => ({
  SiteSettingsEditGate: () => null,
}));

vi.mock('@/components/admin/I18nEditGuideLoader', () => ({
  default: () => null,
}));

vi.mock('@/components/admin/media-upload/SimpleMediaUploadField', () => ({
  default: () => null,
}));

vi.mock('react-router-dom', () => ({
  Link: function MockLink() {
    return null;
  },
}));

function flattenedFields(fields: readonly Field[]): Field[] {
  return fields.flatMap((field) => {
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => flattenedFields(tab.fields));
    }

    if (field.type === 'collapsible' || field.type === 'row') {
      return flattenedFields(field.fields);
    }

    return [field];
  });
}

function guideField(fields: readonly Field[]) {
  return flattenedFields(fields).find((field) => 'name' in field && field.name === 'i18nEditGuide');
}

describe('admin i18n edit guide', () => {
  it.each([
    [News, 'news', ['新闻标题', '列表摘要', '新闻正文']],
    [Solutions, 'solutions', ['方案标题', '卡片说明', '方案要点', '核心产品标签', '详细说明']],
    [ProductGroups, 'product-groups', ['前台显示名称', '大类说明']],
    [Pages, 'pages', ['页面标题']],
    [FAQs, 'faqs', ['问题', '答案']],
  ] as const)('adds a trilingual edit guide to %s', (collection, collectionSlug, labels) => {
    const field = guideField(collection.fields);

    expect(field).toMatchObject({
      name: 'i18nEditGuide',
      type: 'ui',
      custom: {
        collectionSlug,
      },
    });
    expect(field?.admin?.components?.Field).toBe('@/components/admin/I18nEditGuideLoader');

    const requiredLabels = Array.from(
      new Set(
        (field?.custom?.requiredPaths as { label?: string }[] | undefined)?.map(
          (item) => item.label,
        ) ?? [],
      ),
    );
    expect(requiredLabels).toEqual(labels);
  });

  it('adds trilingual address editing to contact settings', () => {
    const field = guideField(SiteSettings.fields);

    expect(field).toMatchObject({
      name: 'i18nEditGuide',
      type: 'ui',
      custom: {
        globalSlug: 'site-settings',
      },
    });
    expect(field?.admin?.components?.Field).toBe('@/components/admin/I18nEditGuideLoader');

    const requiredLabels = Array.from(
      new Set(
        (field?.custom?.requiredPaths as { label?: string }[] | undefined)?.map(
          (item) => item.label,
        ) ?? [],
      ),
    );
    expect(requiredLabels).toEqual(['地址']);
  });

  it('does not add trilingual publishing controls to inquiries', () => {
    expect(guideField(FormSubmissions.fields)).toBeUndefined();
  });
});

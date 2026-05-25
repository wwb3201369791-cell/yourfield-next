import type { CollectionConfig, Field, GlobalConfig } from 'payload/types';
import { describe, expect, it, vi } from 'vitest';

import { FormSubmissions } from '@/collections/FormSubmissions';
import { News } from '@/collections/News';
import { ProductGroups } from '@/collections/ProductGroups';
import { Products } from '@/collections/Products';
import { Solutions } from '@/collections/Solutions';
import DraftStatusCell from '@/components/admin/cells/DraftStatusCell';
import SolutionPositionCell from '@/components/admin/cells/SolutionPositionCell';
import SolutionTitleCell from '@/components/admin/cells/SolutionTitleCell';
import { SiteSettings } from '@/globals/SiteSettings';

vi.mock('@/components/admin/SiteSettingsEditGate', () => ({
  SiteSettingsEditGate: () => null,
}));

vi.mock('react-router-dom', () => ({
  Link: function MockLink() {
    return null;
  },
}));

vi.mock('@/components/admin/cells/SolutionTitleCell', () => ({
  default: function MockSolutionTitleCell() {
    return null;
  },
}));

type ConfigWithFields = Pick<CollectionConfig | GlobalConfig, 'fields'>;

function tabsOf(config: ConfigWithFields) {
  const tabsField = config.fields.find((field) => field.type === 'tabs');

  return tabsField?.type === 'tabs' ? tabsField.tabs : [];
}

function flattenedFields(fields: readonly Field[]): Field[] {
  return fields.flatMap((field) => {
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => flattenedFields(tab.fields));
    }

    if (field.type === 'collapsible') {
      return flattenedFields(field.fields);
    }

    return [field];
  });
}

function namedField(fields: readonly Field[], name: string) {
  return flattenedFields(fields).find((field) => 'name' in field && field.name === name);
}

function isHidden(field: Field | undefined) {
  return field && 'admin' in field
    ? (field.admin as { hidden?: boolean } | undefined)?.hidden
    : undefined;
}

function isReadOnly(field: Field | undefined) {
  return field && 'admin' in field
    ? (field.admin as { readOnly?: boolean } | undefined)?.readOnly
    : undefined;
}

function editTabCondition(config: CollectionConfig | GlobalConfig) {
  const editView = config.admin?.components?.views?.Edit as
    | { Default?: { Tab?: { condition?: () => boolean } } }
    | undefined;

  return editView?.Default?.Tab?.condition;
}

describe('admin collection tabs', () => {
  it.each([
    [FormSubmissions, ['客户信息', '咨询内容', '处理跟进']],
    [ProductGroups, ['基本信息', '前台展示']],
    [
      Products,
      [
        '基本信息',
        '主图与简介',
        '核心卖点',
        '规格参数',
        '尺码对应表',
        '应用场景',
        '详情页图组',
        '资料与认证状态',
        '洗护与维护',
        '常见问题',
        '媒体',
        '发布与 SEO',
      ],
    ],
    [News, ['新闻信息', '正文内容', '发布设置']],
    [Solutions, ['前台展示', '内容要点', '发布设置']],
  ] as const)('uses label-only tabs for %s', (collection, expectedLabels) => {
    const tabs = tabsOf(collection);

    expect(tabs.map((tab) => tab.label)).toEqual(expectedLabels);
    expect(tabs.some((tab) => 'name' in tab && typeof tab.name === 'string')).toBe(false);
  });

  it('keeps form submission assignee fields as plain text fields', () => {
    const fields = flattenedFields(FormSubmissions.fields);
    const assignedTo = namedField(FormSubmissions.fields, 'assignedTo');
    const notes = fields.find((field) => 'name' in field && field.name === 'notes');
    const noteUser =
      notes && 'fields' in notes
        ? notes.fields.find((field) => 'name' in field && field.name === 'user')
        : undefined;

    expect(assignedTo).toMatchObject({ type: 'text' });
    expect(noteUser).toMatchObject({ type: 'text' });
  });

  it('keeps form submission list columns focused on the operational fields', () => {
    expect(FormSubmissions.admin?.defaultColumns).toEqual([
      'inquiryType',
      'name',
      'email',
      'phone',
      'status',
      'createdAt',
      'company',
      'country',
    ]);
  });

  it('keeps form submission list search scoped to customer name', () => {
    expect(FormSubmissions.admin?.listSearchableFields).toEqual(['name']);
  });

  it('keeps form submission detail focused by hiding document and system tabs', () => {
    const systemFields = [
      'sourceUrl',
      'sourceLocale',
      'ip',
      'userAgent',
      'consentAcceptedAt',
      'deletedAt',
    ];

    expect(FormSubmissions.admin?.hideAPIURL).toBe(true);
    expect(editTabCondition(FormSubmissions)?.()).toBe(false);

    for (const fieldName of systemFields) {
      const field = namedField(FormSubmissions.fields, fieldName);

      expect(isHidden(field)).toBe(true);
      expect(isReadOnly(field)).toBe(true);
    }

    expect(namedField(FormSubmissions.fields, 'deletedAt')).toMatchObject({
      label: '软删除时间（系统）',
      admin: {
        description: '仅系统在软删除流程中写入；为空表示当前记录正常。',
      },
    });
  });

  it.each([Products, News, Solutions] as const)(
    'uses one visible custom draft status list column for %s',
    (collection) => {
      const statusBadgeField = namedField(collection.fields, 'statusBadge');
      const internalStatusField = namedField(collection.fields, '_status');

      expect(collection.admin?.defaultColumns).toContain('statusBadge');
      expect(collection.admin?.defaultColumns).not.toContain('_status');
      expect(statusBadgeField).toMatchObject({
        admin: {
          components: {
            Cell: DraftStatusCell,
          },
        },
        label: '状态',
        name: 'statusBadge',
        type: 'ui',
      });
      expect(internalStatusField).toMatchObject({
        admin: {
          disableListColumn: true,
        },
        name: '_status',
        type: 'select',
      });
    },
  );

  it('uses Chinese labels for the news editor fields', () => {
    const newsFieldLabels = [
      ['title', '新闻标题'],
      ['excerpt', '列表摘要'],
      ['author', '作者 / 来源'],
      ['cover', '封面图'],
      ['content', '新闻正文'],
      ['category', '新闻分类'],
      ['tags', '标签'],
      ['publishedAt', '发布时间'],
      ['isFeatured', '首页推荐'],
      ['relatedNews', '相关新闻'],
      ['relatedProducts', '关联产品'],
    ] as const;

    for (const [fieldName, label] of newsFieldLabels) {
      expect(namedField(News.fields, fieldName)).toMatchObject({
        label,
        name: fieldName,
      });
    }

    const category = namedField(News.fields, 'category');
    const tags = namedField(News.fields, 'tags');

    expect(category).toMatchObject({
      options: [
        { label: '公司新闻', value: 'news' },
        { label: '活动动态', value: 'event' },
        { label: '公告', value: 'announcement' },
        { label: '展会信息', value: 'exhibition' },
      ],
    });
    expect(tags && 'fields' in tags ? namedField(tags.fields, 'value') : undefined).toMatchObject({
      label: '标签内容',
    });
  });

  it('keeps the news list focused without the homepage recommendation column', () => {
    const isFeatured = namedField(News.fields, 'isFeatured');

    expect(News.admin?.defaultColumns).toEqual(['title', 'category', 'statusBadge', 'publishedAt']);
    expect(isFeatured).toMatchObject({
      admin: {
        disableListColumn: true,
      },
      label: '首页推荐',
      name: 'isFeatured',
    });
  });

  it('keeps solutions list focused on product-manager fields', () => {
    const solutionId = namedField(Solutions.fields, 'solutionId');
    const order = namedField(Solutions.fields, 'order');
    const isFeatured = namedField(Solutions.fields, 'isFeatured');
    const relatedProductGroups = namedField(Solutions.fields, 'relatedProductGroups');
    const relatedCategories = namedField(Solutions.fields, 'relatedCategories');
    const relatedProducts = namedField(Solutions.fields, 'relatedProducts');

    expect(Solutions.admin?.listSearchableFields).toEqual(['title']);
    expect(Solutions.admin?.defaultColumns).toEqual([
      'title',
      'statusBadge',
      'order',
      'publishedAt',
    ]);
    expect(solutionId).toMatchObject({
      admin: {
        components: {
          Cell: SolutionTitleCell,
        },
        disableListFilter: true,
        hidden: true,
      },
      label: '系统标识（隐藏）',
      name: 'solutionId',
      type: 'text',
    });
    expect(order).toMatchObject({
      admin: {
        disableListFilter: true,
        components: {
          Cell: SolutionPositionCell,
        },
      },
      label: '前台位置',
      name: 'order',
      type: 'number',
    });
    expect(isFeatured).toMatchObject({
      admin: {
        components: {
          Cell: DraftStatusCell,
        },
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
      label: '状态',
      name: 'isFeatured',
    });
    expect(relatedProductGroups).toMatchObject({
      admin: {
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
      name: 'relatedProductGroups',
    });
    expect(relatedCategories).toMatchObject({
      admin: {
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
      name: 'relatedCategories',
    });
    expect(relatedProducts).toMatchObject({
      admin: {
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
      name: 'relatedProducts',
    });
  });

  it.each([
    [Solutions, ['solutionId', 'slug', 'seo']],
    [News, ['slug', 'seo']],
    [ProductGroups, ['groupId', 'slug', 'seo']],
  ] as const)('hides the API and redundant document tab for %s', (collection, preservedFields) => {
    expect(collection.admin?.hideAPIURL).toBe(true);
    expect(editTabCondition(collection)?.()).toBe(false);

    for (const fieldName of preservedFields) {
      const field = namedField(collection.fields, fieldName);

      expect(field).toBeDefined();
      expect(isHidden(field)).toBe(true);
    }
  });

  it('keeps site settings grouped without exposing advanced fields', () => {
    const tabs = tabsOf(SiteSettings);
    const defaultSeo = namedField(SiteSettings.fields, 'defaultSeo');

    expect(SiteSettings.admin?.hideAPIURL).toBe(true);
    expect(editTabCondition(SiteSettings)?.()).toBe(false);
    expect(tabs.map((tab) => tab.label)).toEqual(['联系方式']);
    expect(tabs.some((tab) => 'name' in tab && typeof tab.name === 'string')).toBe(false);
    expect(defaultSeo).toMatchObject({ type: 'group' });
    expect(isHidden(namedField(SiteSettings.fields, 'contact'))).toBeUndefined();
    expect(isHidden(namedField(SiteSettings.fields, 'siteName'))).toBe(true);
    expect(isHidden(namedField(SiteSettings.fields, 'logo'))).toBe(true);
    expect(isHidden(defaultSeo)).toBe(true);
    expect(isHidden(namedField(SiteSettings.fields, 'icp'))).toBe(true);
  });
});

import type { CollectionConfig, Field, GlobalConfig } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { FormSubmissions } from '@/collections/FormSubmissions';
import { News } from '@/collections/News';
import { Pages } from '@/collections/Pages';
import { ProductGroups } from '@/collections/ProductGroups';
import { Products } from '@/collections/Products';
import { Solutions } from '@/collections/Solutions';
import { SiteSettings } from '@/globals/SiteSettings';

vi.mock('@/components/admin/SiteSettingsEditGate', () => ({
  SiteSettingsEditGate: () => null,
}));

vi.mock('@/components/admin/media-upload/SimpleMediaUploadField', () => ({
  default: () => null,
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

function adminCondition(field: Field | undefined) {
  return field && 'admin' in field
    ? (field.admin as { condition?: () => boolean } | undefined)?.condition
    : undefined;
}

function editViewConfig(config: CollectionConfig | GlobalConfig) {
  return config.admin?.components?.views?.edit as
    | {
        default?: { tab?: { condition?: () => boolean } };
        Default?: { tab?: { condition?: () => boolean } };
      }
    | undefined;
}

function editTabCondition(config: CollectionConfig | GlobalConfig) {
  return editViewConfig(config)?.default?.tab?.condition;
}

function zhLabel(label: unknown) {
  return typeof label === 'object' && label !== null && 'zh' in label
    ? (label as { zh?: unknown }).zh
    : label;
}

function localizedLabel(label: unknown, locale: 'en' | 'zh') {
  return typeof label === 'object' && label !== null && locale in label
    ? (label as Record<string, unknown>)[locale]
    : label;
}

describe('admin collection tabs', () => {
  it('keeps dashboard collection labels string-safe while localizing detailed admin copy', () => {
    expect(FormSubmissions.labels?.singular).toBe('咨询表单');
    expect(FormSubmissions.labels?.plural).toBe('咨询表单');
    expect(ProductGroups.labels?.singular).toBe('产品大类');
    expect(ProductGroups.labels?.plural).toBe('产品大类');
    expect(Solutions.labels?.singular).toBe('解决方案');
    expect(Solutions.labels?.plural).toBe('解决方案');
    expect(Products.labels?.singular).toBe('产品');
    expect(Products.labels?.plural).toBe('产品');
    expect(localizedLabel(ProductGroups.admin?.group, 'en')).toBe('Product management');
    expect(localizedLabel(Products.admin?.group, 'en')).toBe('Product management');
    expect(ProductGroups.admin?.description).toMatchObject({
      en: expect.stringContaining('storefront product category'),
      zh: expect.stringContaining('前台产品中心'),
    });
    expect(Solutions.admin?.description).toMatchObject({
      en: expect.stringContaining('Solutions page'),
      zh: expect.stringContaining('解决方案页面'),
    });
  });

  it('shows visibility and storefront order on the product group list', () => {
    expect(ProductGroups.admin?.defaultColumns).toEqual(['name', 'showOnFrontendBadge', 'order']);
    expect(namedField(ProductGroups.fields, 'showOnFrontendBadge')).toMatchObject({
      label: { en: 'Visibility', zh: '显示状态' },
      name: 'showOnFrontendBadge',
      type: 'ui',
    });
  });

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
      ],
    ],
    [News, ['新闻信息', '正文内容']],
    [Solutions, ['前台展示', '内容要点']],
  ] as const)('uses label-only tabs for %s', (collection, expectedLabels) => {
    const tabs = tabsOf(collection);

    expect(tabs.map((tab) => zhLabel(tab.label))).toEqual(expectedLabels);
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

  it('keeps form submission list search scoped to operational customer fields', () => {
    expect(FormSubmissions.admin?.listSearchableFields).toEqual([
      'name',
      'phone',
      'email',
      'company',
    ]);
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

    const deletedAt = namedField(FormSubmissions.fields, 'deletedAt');

    expect(zhLabel((deletedAt as { label?: unknown } | undefined)?.label)).toBe(
      '软删除时间（系统）',
    );
    expect(
      zhLabel((deletedAt as { admin?: { description?: unknown } } | undefined)?.admin?.description),
    ).toBe('仅系统在软删除流程中写入；为空表示当前记录正常。');
    expect(
      localizedLabel(
        (deletedAt as { admin?: { description?: unknown } } | undefined)?.admin?.description,
        'en',
      ),
    ).toContain('system during soft delete');
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
            Cell: '@/components/admin/cells/DraftStatusCell',
          },
        },
        name: 'statusBadge',
        type: 'ui',
      });
      expect(zhLabel((statusBadgeField as { label?: unknown } | undefined)?.label)).toBe('状态');
      expect(internalStatusField).toMatchObject({
        admin: {
          disableListColumn: true,
        },
        name: '_status',
        type: 'select',
      });
    },
  );

  it('uses localized labels for the news editor fields', () => {
    const newsFieldLabels = [
      ['title', '新闻标题'],
      ['excerpt', '列表摘要'],
      ['author', '作者 / 来源'],
      ['cover', '封面图'],
      ['featuredVideo', '英文/中文重点卡片视频'],
      ['featuredVideoRu', '俄语重点卡片视频'],
      ['content', '新闻正文'],
      ['tags', '标签'],
      ['publishedAt', '发布时间'],
      ['featuredOrder', '重点位置'],
      ['isFeatured', '重点新闻'],
      ['relatedNews', '相关新闻'],
      ['relatedProducts', '关联产品'],
    ] as const;

    for (const [fieldName, label] of newsFieldLabels) {
      const field = namedField(News.fields, fieldName);

      expect(field).toMatchObject({ name: fieldName });
      expect(zhLabel((field as { label?: unknown } | undefined)?.label)).toBe(label);
    }

    const category = namedField(News.fields, 'category');
    const cover = namedField(News.fields, 'cover');
    const featuredVideo = namedField(News.fields, 'featuredVideo');
    const featuredVideoRu = namedField(News.fields, 'featuredVideoRu');
    const tags = namedField(News.fields, 'tags');
    const relatedNews = namedField(News.fields, 'relatedNews');
    const relatedProducts = namedField(News.fields, 'relatedProducts');

    expect(category).toMatchObject({
      admin: {
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
      defaultValue: 'news',
    });
    expect(zhLabel((category as { label?: unknown } | undefined)?.label)).toBe('新闻分类（系统）');
    expect(
      category && 'options' in category
        ? (category.options as Array<{ label: unknown; value: unknown }>).map((option) => ({
            label: zhLabel(option.label),
            value: option.value,
          }))
        : [],
    ).toEqual([
      { label: '公司新闻', value: 'news' },
      { label: '活动动态', value: 'event' },
      { label: '公告', value: 'announcement' },
      { label: '展会信息', value: 'exhibition' },
    ]);
    expect(cover).toMatchObject({
      name: 'cover',
      relationTo: 'media',
      type: 'upload',
    });
    expect(
      zhLabel((cover as { admin?: { description?: unknown } } | undefined)?.admin?.description),
    ).toBe(
      '用于新闻列表和详情页的真实封面图。建议 JPG / PNG / WebP / GIF，推荐 1600 × 900 px（16:9）或至少 1200 × 675 px，单图建议不超过 10MB。视频新闻可不上传；没有视频时建议上传，否则前台会直接隐藏媒体区域，不再使用静态占位图。',
    );
    expect(
      localizedLabel(
        (cover as { admin?: { description?: unknown } } | undefined)?.admin?.description,
        'en',
      ),
    ).toContain('Real cover image');
    expect((cover as { required?: unknown } | undefined)?.required).not.toBe(true);
    expect(featuredVideo).toMatchObject({
      custom: {
        mediaKind: 'video',
      },
      name: 'featuredVideo',
      relationTo: 'media',
      type: 'upload',
    });
    expect(featuredVideoRu).toMatchObject({
      custom: {
        mediaKind: 'video',
      },
      name: 'featuredVideoRu',
      relationTo: 'media',
      type: 'upload',
    });
    expect(tags).toMatchObject({
      admin: {
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
    });
    expect(
      zhLabel(
        (tags && 'fields' in tags
          ? (namedField(tags.fields, 'value') as { label?: unknown } | undefined)
          : undefined
        )?.label,
      ),
    ).toBe('标签内容');
    expect(relatedNews).toMatchObject({
      admin: {
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
    });
    expect(relatedProducts).toMatchObject({
      admin: {
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
    });
  });

  it('keeps the news list focused on publishing status and featured position', () => {
    const isFeatured = namedField(News.fields, 'isFeatured');
    const featuredOrder = namedField(News.fields, 'featuredOrder');

    expect(News.admin?.defaultColumns).toEqual([
      'title',
      'statusBadge',
      'featuredOrder',
      'publishedAt',
    ]);
    expect(featuredOrder).toMatchObject({
      max: 3,
      min: 0,
      name: 'featuredOrder',
      type: 'number',
    });
    expect(
      zhLabel(
        (featuredOrder as { admin?: { description?: unknown } } | undefined)?.admin?.description,
      ),
    ).toBe(
      '控制新闻中心顶部三张重点新闻卡片和首页新闻预览顺序；直接填 1、2、3，数字越小越靠前。留空或 0 表示按发布时间补位。',
    );
    expect(
      localizedLabel(
        (featuredOrder as { admin?: { description?: unknown } } | undefined)?.admin?.description,
        'en',
      ),
    ).toContain('featured News Center cards');
    expect(isFeatured).toMatchObject({
      admin: {
        disableListColumn: true,
      },
      name: 'isFeatured',
    });
    expect(zhLabel((isFeatured as { label?: unknown } | undefined)?.label)).toBe('重点新闻');
  });

  it.each([Products, News, Solutions, Pages] as const)(
    'keeps publishedAt as an automatic system timestamp for %s',
    (collection) => {
      const publishedAt = namedField(collection.fields, 'publishedAt');

      expect(publishedAt).toMatchObject({
        name: 'publishedAt',
        type: 'date',
      });
      expect(adminCondition(publishedAt)?.()).toBe(false);
      expect((publishedAt as { required?: unknown } | undefined)?.required).not.toBe(true);
    },
  );

  it('keeps solutions list focused on product-manager fields', () => {
    const solutionId = namedField(Solutions.fields, 'solutionId');
    const order = namedField(Solutions.fields, 'order');
    const isFeatured = namedField(Solutions.fields, 'isFeatured');
    const relatedProductGroups = namedField(Solutions.fields, 'relatedProductGroups');
    const relatedCategories = namedField(Solutions.fields, 'relatedCategories');
    const relatedProducts = namedField(Solutions.fields, 'relatedProducts');

    expect(Solutions.admin?.listSearchableFields).toEqual(['title']);
    expect(Solutions.admin?.useAsTitle).toBe('solutionId');
    expect(Solutions.defaultSort).toBe('order');
    expect(Solutions.admin?.defaultColumns).toEqual([
      'title',
      'statusBadge',
      'order',
      'publishedAt',
    ]);
    expect(solutionId).toMatchObject({
      admin: {
        components: {
          Cell: '@/components/admin/cells/SolutionTitleCell',
        },
        disableListFilter: true,
        hidden: true,
      },
      name: 'solutionId',
      type: 'text',
    });
    expect(zhLabel((solutionId as { label?: unknown } | undefined)?.label)).toBe(
      '系统标识（隐藏）',
    );
    expect(localizedLabel((solutionId as { label?: unknown } | undefined)?.label, 'en')).toBe(
      'System key (hidden)',
    );
    expect(order).toMatchObject({
      admin: {
        disableListFilter: true,
        components: {
          Cell: '@/components/admin/cells/SolutionPositionCell',
        },
      },
      defaultValue: 1,
      name: 'order',
      type: 'number',
    });
    expect(zhLabel((order as { label?: unknown } | undefined)?.label)).toBe('前台位置');
    expect(
      zhLabel((order as { admin?: { description?: unknown } } | undefined)?.admin?.description),
    ).toBe('控制解决方案页面、顶部下拉菜单与页脚导航的展示顺序；直接填 1、2、3，数字越小越靠前。');
    expect(
      localizedLabel(
        (order as { admin?: { description?: unknown } } | undefined)?.admin?.description,
        'en',
      ),
    ).toContain('Solutions page');
    expect(isFeatured).toMatchObject({
      admin: {
        components: {
          Cell: '@/components/admin/cells/DraftStatusCell',
        },
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
      name: 'isFeatured',
    });
    expect(zhLabel((isFeatured as { label?: unknown } | undefined)?.label)).toBe('状态');
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

  it.each([Products, News, Solutions] as const)(
    'does not expose manual SEO fields for %s',
    (collection) => {
      expect(namedField(collection.fields, 'seo')).toBeUndefined();
    },
  );

  it.each([
    [Solutions, ['solutionId', 'slug']],
    [News, ['slug']],
    [ProductGroups, ['groupId', 'slug', 'seo']],
  ] as const)('hides the API and redundant document tab for %s', (collection, preservedFields) => {
    expect(collection.admin?.hideAPIURL).toBe(true);
    expect(editViewConfig(collection)?.default).toBeDefined();
    expect(editViewConfig(collection)?.Default).toBeUndefined();
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
    expect(editViewConfig(SiteSettings)?.default).toBeDefined();
    expect(editViewConfig(SiteSettings)?.Default).toBeUndefined();
    expect(editTabCondition(SiteSettings)?.()).toBe(false);
    expect(tabs.map((tab) => zhLabel(tab.label))).toEqual(['联系方式']);
    expect(tabs.some((tab) => 'name' in tab && typeof tab.name === 'string')).toBe(false);
    expect(defaultSeo).toMatchObject({ type: 'group' });
    expect(isHidden(namedField(SiteSettings.fields, 'contact'))).toBeUndefined();
    expect(isHidden(namedField(SiteSettings.fields, 'siteName'))).toBe(true);
    expect(isHidden(namedField(SiteSettings.fields, 'logo'))).toBe(true);
    expect(namedField(SiteSettings.fields, 'favicon')).toBeUndefined();
    expect(namedField(SiteSettings.fields, 'appleTouchIcon')).toBeUndefined();
    expect(isHidden(defaultSeo)).toBe(true);
    expect(isHidden(namedField(SiteSettings.fields, 'icp'))).toBe(true);
  });
});

import { describe, expect, it, vi } from 'vitest';

import { Products } from '../Products';

vi.mock('@/components/admin/media-upload/SimpleMediaUploadField', () => ({
  default: () => null,
}));

type FieldLike = {
  fields?: FieldLike[];
  label?: string;
  maxRows?: number;
  name?: string;
  required?: boolean;
  tabs?: Array<{ fields: FieldLike[]; label: string }>;
  type?: string;
};

type ProductBeforeChangeHook = (args: {
  data: Record<string, unknown>;
  originalDoc?: Record<string, unknown>;
}) => unknown;

const rootFields = Products.fields as FieldLike[];
const tabsField = rootFields.find((field) => field.type === 'tabs');
const tabs = tabsField?.tabs ?? [];

function findFieldByName(fields: FieldLike[], name: string): FieldLike | undefined {
  for (const field of fields) {
    if (field.name === name) {
      return field;
    }

    const inChildren = field.fields ? findFieldByName(field.fields, name) : undefined;
    if (inChildren) {
      return inChildren;
    }

    if (field.tabs) {
      for (const tab of field.tabs) {
        const inTab = findFieldByName(tab.fields, name);
        if (inTab) {
          return inTab;
        }
      }
    }
  }

  return undefined;
}

function tab(label: string) {
  return tabs.find((candidate) => candidate.label === label);
}

function hasField(label: string, name: string) {
  return Boolean(tab(label)?.fields.some((field) => field.name === name));
}

function runProductBeforeChangeHooks(
  data: Record<string, unknown>,
  originalDoc?: Record<string, unknown>,
) {
  let nextData = data;
  const hooks = (Products.hooks?.beforeChange ?? []) as ProductBeforeChangeHook[];

  for (const hook of hooks) {
    const result = hook(originalDoc ? { data: nextData, originalDoc } : { data: nextData });

    if (result && typeof result === 'object') {
      nextData = result as Record<string, unknown>;
    }
  }

  return nextData;
}

describe('Products schema for visual product editing', () => {
  it('uses the supported Payload document default view key for the frontend-like fill-in editor', () => {
    const editViews = Products.admin?.components?.views?.edit as
      | Record<string, { Component?: string } | undefined>
      | undefined;

    expect(editViews?.default?.Component).toBe(
      '@/components/admin/product-editor/ProductVisualEditor',
    );
    expect(editViews?.Default).toBeUndefined();
  });

  it('keeps hero images to one main image while leaving visual group images uncapped', () => {
    const productImages = findFieldByName(rootFields, 'images');
    const visualGroups = findFieldByName(rootFields, 'visualGroups');
    const visualGroupImages = visualGroups?.fields?.find((field) => field.name === 'images');

    expect(productImages?.maxRows).toBe(1);
    expect(productImages?.label).toContain('发布必填');
    expect(visualGroupImages?.maxRows).toBeUndefined();
  });

  it('blocks publishing product records without a real main image', () => {
    expect(() =>
      runProductBeforeChangeHooks({
        _status: 'published',
        images: [],
        name: '无图产品',
        productId: 'missing-image-product',
      }),
    ).toThrow('产品发布前必须上传产品主图');
  });

  it('blocks publishing product records without a positive storefront display order', () => {
    expect(() =>
      runProductBeforeChangeHooks({
        _status: 'published',
        displayOrder: 0,
        images: [{ file: 1 }],
        name: '未排序产品',
        productId: 'missing-display-order-product',
      }),
    ).toThrow('产品发布前必须填写大类内展示序号');
  });

  it('allows drafts without images and published updates that keep an existing image', () => {
    expect(() =>
      runProductBeforeChangeHooks({
        _status: 'draft',
        images: [],
        name: '草稿无图产品',
        productId: 'draft-missing-image-product',
      }),
    ).not.toThrow();

    expect(() =>
      runProductBeforeChangeHooks(
        {
          _status: 'published',
          displayOrder: 2,
          name: '已有图片产品',
          productId: 'product-with-image',
        },
        {
          _status: 'published',
          displayOrder: 2,
          images: [{ file: 1 }],
        },
      ),
    ).not.toThrow();
  });

  it('organizes product tabs in the same order as the frontend detail page blocks', () => {
    expect(tabs.map((candidate) => candidate.label)).toEqual([
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
    ]);
  });

  it('removes dead product fields from the editor schema', () => {
    expect(findFieldByName(rootFields, 'category')).toBeUndefined();
    expect(findFieldByName(rootFields, 'industries')).toBeUndefined();
    expect(findFieldByName(rootFields, 'tags')).toBeUndefined();
    expect(findFieldByName(rootFields, 'relatedProducts')).toBeUndefined();
    expect(findFieldByName(rootFields, 'isFeatured')).toBeUndefined();
    expect(findFieldByName(rootFields, 'seo')).toBeUndefined();
  });

  it('lifts frontend detail fields out of the old P3+ collapsible into first-class tabs', () => {
    expect(hasField('主图与简介', 'images')).toBe(true);
    expect(hasField('核心卖点', 'sellingPoints')).toBe(true);
    expect(hasField('规格参数', 'specifications')).toBe(true);
    expect(hasField('尺码对应表', 'sizeGuide')).toBe(true);
    expect(hasField('应用场景', 'scenarios')).toBe(true);
    expect(hasField('详情页图组', 'visualGroups')).toBe(true);
    expect(hasField('资料与认证状态', 'qualityEvidence')).toBe(true);
    expect(hasField('洗护与维护', 'careInstructions')).toBe(true);
    expect(hasField('常见问题', 'productFaqs')).toBe(true);

    expect(tab('发布与 SEO')).toBeUndefined();
  });
});

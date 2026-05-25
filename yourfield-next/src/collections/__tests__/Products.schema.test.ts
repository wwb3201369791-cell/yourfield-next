import { describe, expect, it } from 'vitest';

import { Products } from '../Products';

type FieldLike = {
  fields?: FieldLike[];
  label?: string;
  maxRows?: number;
  name?: string;
  tabs?: Array<{ fields: FieldLike[]; label: string }>;
  type?: string;
};

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

describe('Products schema for visual product editing', () => {
  it('does not cap product images or visual group images at 20 rows', () => {
    const productImages = findFieldByName(rootFields, 'images');
    const visualGroups = findFieldByName(rootFields, 'visualGroups');
    const visualGroupImages = visualGroups?.fields?.find((field) => field.name === 'images');

    expect(productImages?.maxRows).toBeUndefined();
    expect(visualGroupImages?.maxRows).toBeUndefined();
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
      '发布与 SEO',
    ]);
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
    expect(hasField('常见问题', 'faqs')).toBe(true);

    const seoTab = tab('发布与 SEO');
    expect(seoTab?.fields.some((field) => field.type === 'collapsible')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import type { Field } from 'payload/types';

import { Products } from '@/collections/Products';

function flattenFields(fields: readonly Field[]): Field[] {
  return fields.flatMap((field) => {
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => flattenFields(tab.fields));
    }

    if (field.type === 'collapsible') {
      return flattenFields(field.fields);
    }

    return [field];
  });
}

const getNamedField = (name: string) =>
  flattenFields(Products.fields).find((field) => 'name' in field && field.name === name);

describe('Products admin structure', () => {
  it('keeps the daily list focused on editable product information', () => {
    expect(Products.admin?.defaultColumns).toEqual([
      'model',
      'name',
      'productGroup',
      'statusBadge',
      'publishedAt',
    ]);
    expect(getNamedField('statusBadge')).toMatchObject({ label: '状态', type: 'ui' });
    expect(getNamedField('productId')?.admin).toMatchObject({
      disableListColumn: true,
    });
  });

  it('groups edit fields into label-only tabs without changing data paths', () => {
    const tabsField = Products.fields.find((field) => field.type === 'tabs');

    expect(tabsField).toMatchObject({ type: 'tabs' });
    expect(tabsField && 'tabs' in tabsField ? tabsField.tabs.map((tab) => tab.label) : []).toEqual([
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
    expect(
      tabsField && 'tabs' in tabsField
        ? tabsField.tabs.some((tab) => 'name' in tab && typeof tab.name === 'string')
        : true,
    ).toBe(false);
  });

  it('requires products to belong directly to a product group', () => {
    const productGroup = getNamedField('productGroup');

    expect(productGroup).toMatchObject({
      label: '所属产品大类',
      relationTo: 'product-groups',
      required: true,
      type: 'relationship',
    });
  });

  it('keeps legacy product categories hidden from daily product creation', () => {
    const category = getNamedField('category');

    expect(category).toMatchObject({
      label: '旧产品分类（内部兼容）',
      relationTo: 'product-categories',
      type: 'relationship',
    });
    expect(category?.admin).toMatchObject({
      disableListColumn: true,
      disableListFilter: true,
      hidden: true,
    });
  });

  it('allows blank specification rows so publishing controls are not blocked by old imports', () => {
    const specifications = getNamedField('specifications');
    const fields = specifications && 'fields' in specifications ? specifications.fields : [];
    const label = fields.find((field) => 'name' in field && field.name === 'label');
    const value = fields.find((field) => 'name' in field && field.name === 'value');

    expect(label).toMatchObject({ label: '参数名', type: 'text' });
    expect(value).toMatchObject({ label: '参数值', type: 'text' });
    expect(label && 'required' in label ? label.required : undefined).toBeUndefined();
    expect(value && 'required' in value ? value.required : undefined).toBeUndefined();
  });

  it('revalidates the frontend when a product is deleted', () => {
    expect(Products.hooks?.afterDelete).toHaveLength(2);
  });
});

import type { Field } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { Products } from '@/collections/Products';
import { adminLabel } from '@/lib/payload/adminText';

vi.mock('@/components/admin/media-upload/SimpleMediaUploadField', () => ({
  default: () => null,
}));

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

function getFieldByPath(path: readonly string[]) {
  let fields = flattenFields(Products.fields);
  let found: Field | undefined;

  for (const segment of path) {
    found = fields.find((field) => 'name' in field && field.name === segment);
    if (!found) {
      return undefined;
    }

    fields = 'fields' in found ? found.fields : [];
  }

  return found;
}

describe('Products admin structure', () => {
  it('keeps the daily list focused on editable product information', () => {
    expect(Products.admin?.defaultColumns).toEqual([
      'model',
      'name',
      'productGroup',
      'statusBadge',
      'publishedAt',
      'rowActions',
    ]);
    expect(getNamedField('statusBadge')).toMatchObject({ label: adminLabel('状态'), type: 'ui' });
    expect(getNamedField('productId')?.admin).toMatchObject({
      disableListColumn: true,
    });
  });

  it('groups edit fields into label-only tabs without changing data paths', () => {
    const tabsField = Products.fields.find((field) => field.type === 'tabs');

    expect(tabsField).toMatchObject({ type: 'tabs' });
    expect(tabsField && 'tabs' in tabsField ? tabsField.tabs.map((tab) => tab.label) : []).toEqual([
      adminLabel('基本信息'),
      adminLabel('主图与简介'),
      adminLabel('核心卖点'),
      adminLabel('规格参数'),
      adminLabel('尺码对应表'),
      adminLabel('应用场景'),
      adminLabel('详情页图组'),
      adminLabel('资料与认证状态'),
      adminLabel('洗护与维护'),
      adminLabel('常见问题'),
      adminLabel('SEO 搜索优化'),
      adminLabel('媒体'),
    ]);
    expect(
      tabsField && 'tabs' in tabsField
        ? tabsField.tabs.some((tab) => 'name' in tab && typeof tab.name === 'string')
        : true,
    ).toBe(false);
  });

  it('requires products to belong directly to a product group with a stable admin list cell', () => {
    const productGroup = getNamedField('productGroup');

    expect(productGroup).toMatchObject({
      admin: {
        components: {
          Cell: '@/components/admin/cells/ProductGroupCell',
        },
      },
      label: adminLabel('所属产品大类'),
      relationTo: 'product-groups',
      required: true,
      type: 'relationship',
    });
  });

  it('explains product frontend order as direct operator-facing positions', () => {
    const displayOrder = getNamedField('displayOrder');

    expect(displayOrder).toMatchObject({
      defaultValue: 0,
      label: adminLabel('前台展示位置'),
      name: 'displayOrder',
      type: 'number',
    });
    expect(displayOrder?.admin).toMatchObject({
      description: adminLabel('直接填 1、2、3；数字越小越靠前；发布前必须填写，0 仅用于草稿暂存。'),
      position: 'sidebar',
    });
  });

  it('does not expose legacy product categories in daily product creation', () => {
    const category = getNamedField('category');

    expect(category).toBeUndefined();
  });

  it('allows blank specification rows so publishing controls are not blocked by old imports', () => {
    const specifications = getNamedField('specifications');
    const fields = specifications && 'fields' in specifications ? specifications.fields : [];
    const label = fields.find((field) => 'name' in field && field.name === 'label');
    const value = fields.find((field) => 'name' in field && field.name === 'value');

    expect(label).toMatchObject({ label: adminLabel('参数名'), type: 'text' });
    expect(value).toMatchObject({ label: adminLabel('参数值'), type: 'text' });
    expect(label && 'required' in label ? label.required : undefined).toBeUndefined();
    expect(value && 'required' in value ? value.required : undefined).toBeUndefined();
  });

  it('keeps detail-section fields optional so products can publish before every module is filled', () => {
    const optionalPaths = [
      ['features', 'title'],
      ['sellingPoints', 'title'],
      ['scenarios', 'title'],
      ['qualityEvidence', 'type'],
      ['qualityEvidence', 'title'],
      ['sizeGuide', 'columns', 'label'],
      ['sizeGuide', 'rows', 'label'],
      ['sizeGuide', 'rows', 'values', 'value'],
    ];

    for (const path of optionalPaths) {
      const field = getFieldByPath(path);
      expect(field).toBeTruthy();
      expect(field && 'required' in field ? field.required : undefined).toBeUndefined();
    }
  });

  it('does not force every localized product detail field to be complete before publishing', async () => {
    const beforeChangeHooks = Products.hooks?.beforeChange ?? [];
    let data: Record<string, unknown> = {
      _status: 'published',
      description: '用于电力作业的防护服。',
      displayOrder: 1,
      images: [{ file: 'media-1' }],
      name: '防电弧服',
      productGroup: 'product-groups-1',
      productId: 'arc-flash-suit',
    };

    for (const hook of beforeChangeHooks) {
      data = (await hook({
        collection: Products,
        context: {},
        data,
        operation: 'update',
        originalDoc: {
          _status: 'draft',
          id: 'products-1',
        },
        req: {
          payload: {
            config: {
              localization: {
                defaultLocale: 'zh',
              },
            },
            findByID: vi.fn().mockResolvedValue({
              description: {
                en: 'Protective clothing for electrical work.',
                ru: 'Защитная одежда для электромонтажных работ.',
                zh: '用于电力作业的防护服。',
              },
              name: {
                en: 'Arc flash suit',
                ru: 'Костюм для защиты от дуговой вспышки',
                zh: '防电弧服',
              },
            }),
          },
        },
      } as never)) as Record<string, unknown>;
    }

    expect(data).toMatchObject({
      _status: 'published',
      name: '防电弧服',
      productGroup: 'product-groups-1',
      productId: 'arc-flash-suit',
    });
    expect(data.publishedAt).toEqual(expect.any(String));
  });

  it('revalidates the frontend when a product is deleted', () => {
    expect(Products.hooks?.afterDelete).toHaveLength(2);
  });
});

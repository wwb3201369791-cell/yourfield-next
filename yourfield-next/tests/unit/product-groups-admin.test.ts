import { describe, expect, it } from 'vitest';
import type { Field } from 'payload/types';

import { ProductGroups } from '@/collections/ProductGroups';
import SolutionPositionCell from '@/components/admin/cells/SolutionPositionCell';

function flattenFields(fields: readonly Field[]): Field[] {
  return fields.flatMap((field) => {
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => flattenFields(tab.fields));
    }

    return [field];
  });
}

const getField = (name: string) =>
  flattenFields(ProductGroups.fields).find((field) => 'name' in field && field.name === name);

describe('ProductGroups admin list', () => {
  it('keeps the list focused on frontend catalog maintenance', () => {
    expect(ProductGroups.admin?.defaultColumns).toEqual(['name', 'order']);
    expect(ProductGroups.defaultSort).toBe('order');
    expect(ProductGroups.admin?.listSearchableFields).toEqual(['name', 'groupId']);
  });

  it('uses concise internal fields without showing them as list columns', () => {
    const field = getField('groupId');
    const showOnFrontendField = getField('showOnFrontend');
    const orderField = getField('order');

    expect((field as { label?: unknown } | undefined)?.label).toBe('大类英文标识');
    expect(field?.admin).toMatchObject({ disableListColumn: true });
    expect(showOnFrontendField?.admin).toMatchObject({ disableListColumn: true });
    expect((orderField as { label?: unknown } | undefined)?.label).toBe('前台展示位置');
    expect(orderField?.admin).toMatchObject({
      components: {
        Cell: SolutionPositionCell,
      },
    });
  });

  it('groups daily editing fields into label-only tabs without changing field paths', () => {
    const [tabsField] = ProductGroups.fields;

    expect(tabsField).toMatchObject({ type: 'tabs' });
    expect(tabsField && 'tabs' in tabsField ? tabsField.tabs.map((tab) => tab.label) : []).toEqual([
      '基本信息',
      '展示与排序',
      '媒体',
      'SEO / 系统',
    ]);
    expect(
      tabsField && 'tabs' in tabsField
        ? tabsField.tabs.some((tab) => 'name' in tab && typeof tab.name === 'string')
        : true,
    ).toBe(false);
  });

  it('hides low-frequency fields from list columns and filters', () => {
    for (const fieldName of ['slug', 'description', 'cover', 'icon', 'seo']) {
      const field = getField(fieldName);
      const admin = field?.admin as
        | { disableListColumn?: boolean; disableListFilter?: boolean }
        | undefined;

      expect(field).toBeDefined();
      expect(admin?.disableListColumn).toBe(true);
      expect(admin?.disableListFilter).toBe(true);
    }
  });
});

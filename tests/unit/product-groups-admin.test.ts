import type { Field } from 'payload';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ProductGroups } from '@/collections/ProductGroups';
import SolutionPositionCell from '@/components/admin/cells/SolutionPositionCell';
import { adminLabel } from '@/lib/payload/adminText';

vi.mock('@/components/admin/adminUiLocale', () => ({
  useAdminText: () => (copy: string | { zh: string }) =>
    typeof copy === 'string' ? copy : copy.zh,
}));

vi.mock('@/components/admin/media-upload/SimpleMediaUploadField', () => ({
  default: () => null,
}));

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
    expect(ProductGroups.admin?.defaultColumns).toEqual([
      'name',
      'showOnFrontendBadge',
      'order',
      'rowActions',
    ]);
    expect(ProductGroups.defaultSort).toBe('order');
    expect(ProductGroups.admin?.listSearchableFields).toEqual(['name', 'groupId']);
  });

  it('uses concise internal fields without showing them as list columns', () => {
    const field = getField('groupId');
    const showOnFrontendField = getField('showOnFrontend');
    const orderField = getField('order');

    expect((field as { label?: unknown } | undefined)?.label).toEqual(
      adminLabel('大类英文标识（系统）'),
    );
    expect(field?.admin).toMatchObject({ disableListColumn: true });
    expect(showOnFrontendField?.admin).toMatchObject({ disableListColumn: true });
    expect((orderField as { label?: unknown } | undefined)?.label).toEqual(
      adminLabel('前台展示位置'),
    );
    expect(orderField).toMatchObject({ defaultValue: 1 });
    expect(orderField?.admin).toMatchObject({
      components: {
        Cell: '@/components/admin/cells/SolutionPositionCell',
      },
    });
    expect(
      (showOnFrontendField?.admin as { description?: unknown } | undefined)?.description,
    ).toBeUndefined();
    expect((orderField?.admin as { description?: unknown } | undefined)?.description).toEqual({
      en: 'Use 1, 2, 3… Lower numbers appear first on the storefront.',
      zh: '直接填 1、2、3；数字越小越靠前。',
    });
  });

  it('uses exact operator-facing labels for frontend positions', () => {
    const first = SolutionPositionCell({ cellData: 1 }) as ReactElement<{ children: string }>;
    const second = SolutionPositionCell({ cellData: 2 }) as ReactElement<{ children: string }>;
    const tenth = SolutionPositionCell({
      cellData: 10,
    }) as ReactElement<{ children: string }>;
    const unset = SolutionPositionCell({ cellData: 0 }) as ReactElement<{ children: string }>;

    expect(first.props.children).toBe('第 1 位');
    expect(second.props.children).toBe('第 2 位');
    expect(tenth.props.children).toBe('第 10 位');
    expect(unset.props.children).toBe('未设置');
  });

  it('groups daily editing fields into label-only tabs without changing field paths', () => {
    const tabsField = ProductGroups.fields.find((field) => field.type === 'tabs');

    expect(tabsField).toMatchObject({ type: 'tabs' });
    expect(tabsField && 'tabs' in tabsField ? tabsField.tabs.map((tab) => tab.label) : []).toEqual([
      adminLabel('基本信息'),
      adminLabel('前台展示'),
    ]);
    expect(
      tabsField && 'tabs' in tabsField
        ? tabsField.tabs.some((tab) => 'name' in tab && typeof tab.name === 'string')
        : true,
    ).toBe(false);
  });

  it('hides low-frequency fields from list columns and filters', () => {
    for (const fieldName of ['slug', 'description', 'seo']) {
      const field = getField(fieldName);
      const admin = field?.admin as
        | { disableListColumn?: boolean; disableListFilter?: boolean }
        | undefined;

      expect(field).toBeDefined();
      expect(admin?.disableListColumn).toBe(true);
      expect(admin?.disableListFilter).toBe(true);
    }
  });

  it('does not expose unused image upload fields in daily editing', () => {
    expect(getField('cover')).toBeUndefined();
    expect(getField('icon')).toBeUndefined();
  });
});

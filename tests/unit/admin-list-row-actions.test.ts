// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { createElement } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProductGroups } from '@/collections/ProductGroups';
import { Products } from '@/collections/Products';
import { Solutions } from '@/collections/Solutions';
import AdminListRowActionsCell from '@/components/admin/cells/AdminListRowActionsCell';
import {
  adminListRowActionConfig,
  buildAdminListCreateHref,
  buildAdminListEditHref,
  buildNeighborLookupUrl,
  rowActionDocumentId,
  rowActionOrderValue,
  rowActionProductGroupId,
} from '@/components/admin/cells/listRowActions';

vi.mock('@payloadcms/ui', () => ({
  useConfig: () => ({
    config: {
      routes: {
        admin: '/admin',
        api: '/payload-api',
      },
    },
  }),
  useTranslation: () => ({ i18n: { language: 'zh' } }),
}));

afterEach(() => {
  cleanup();
});

describe('admin collection row actions', () => {
  it('replaces the old global page dropdown with a list-row operation column', () => {
    const configSource = readFileSync('src/payload.config.ts', 'utf8');

    expect(configSource).not.toContain('AdminPageQuickActions');
    expect(configSource).toContain('AdminInterfaceLanguageSwitch');
    expect(Solutions.admin?.defaultColumns).toContain('rowActions');
    expect(ProductGroups.admin?.defaultColumns).toContain('rowActions');
    expect(Products.admin?.defaultColumns).toContain('rowActions');
  });

  it('builds row edit links and collection-specific create links', () => {
    expect(buildAdminListEditHref('/admin/', 'solutions', 12)).toBe(
      '/admin/collections/solutions/12',
    );
    expect(buildAdminListCreateHref('/admin', 'products', { productGroup: 7 })).toBe(
      '/admin/collections/products/create?productGroup=7',
    );

    expect(
      adminListRowActionConfig.solutions.createActions.map((action) => action.collectionSlug),
    ).toEqual(['solutions', 'product-groups', 'products']);
    expect(
      adminListRowActionConfig['product-groups'].createActions.map((action) => action.key),
    ).toEqual(['create-product-group', 'create-product']);
    expect(adminListRowActionConfig.products.orderField).toBe('displayOrder');
  });

  it('extracts document, order, and product-group scope from Payload list row data', () => {
    expect(rowActionDocumentId({ id: 42 })).toBe('42');
    expect(rowActionDocumentId({ id: null })).toBeNull();
    expect(rowActionOrderValue({ order: 3 }, 'order')).toBe(3);
    expect(rowActionOrderValue({ displayOrder: 0 }, 'displayOrder')).toBe(0);
    expect(rowActionProductGroupId({ productGroup: 9 })).toBe('9');
    expect(rowActionProductGroupId({ productGroup: { id: 10, name: 'Fire' } })).toBe('10');
  });

  it('queries the nearest row in the same sorted scope for move up/down operations', () => {
    expect(
      buildNeighborLookupUrl({
        apiBase: '/payload-api',
        collectionSlug: 'solutions',
        direction: 'up',
        order: 3,
        orderField: 'order',
      }),
    ).toBe('/payload-api/solutions?depth=0&limit=1&where%5Border%5D%5Bless_than%5D=3&sort=-order');

    expect(
      buildNeighborLookupUrl({
        apiBase: '/payload-api',
        collectionSlug: 'products',
        direction: 'down',
        order: 2,
        orderField: 'displayOrder',
        productGroupId: '7',
      }),
    ).toBe(
      '/payload-api/products?depth=0&limit=1&where%5BdisplayOrder%5D%5Bgreater_than%5D=2&where%5BproductGroup%5D%5Bequals%5D=7&sort=displayOrder',
    );
  });

  it('renders row-level edit, reorder, and related create actions for product groups', () => {
    window.history.pushState({}, '', '/admin/collections/product-groups');

    render(
      createElement(AdminListRowActionsCell, { rowData: { id: 5, order: 2, productGroup: 5 } }),
    );

    expect(screen.getByRole('link', { name: '编辑' }).getAttribute('href')).toBe(
      '/admin/collections/product-groups/5',
    );
    expect((screen.getByRole('button', { name: '上移' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect((screen.getByRole('button', { name: '下移' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect(screen.getByRole('link', { name: '添加产品大类' }).getAttribute('href')).toBe(
      '/admin/collections/product-groups/create',
    );
    expect(screen.getByRole('link', { name: '添加产品' }).getAttribute('href')).toBe(
      '/admin/collections/products/create?productGroup=5',
    );
  });
});

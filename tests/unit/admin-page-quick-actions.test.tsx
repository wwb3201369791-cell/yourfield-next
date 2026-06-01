// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AdminPageQuickActions,
  adminQuickActionGroups,
  buildAdminQuickActionHref,
} from '@/components/admin/AdminPageQuickActions';

const translationMock = vi.hoisted(() => ({
  i18n: { language: 'zh' },
}));

vi.mock('@payloadcms/ui', () => ({
  useConfig: () => ({
    config: {
      routes: {
        admin: '/admin',
      },
    },
  }),
  useTranslation: () => translationMock,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  translationMock.i18n.language = 'zh';
});

describe('AdminPageQuickActions', () => {
  it('builds admin-relative quick action links without double slashes', () => {
    expect(buildAdminQuickActionHref('/admin/', '/collections/products')).toBe(
      '/admin/collections/products',
    );
    expect(buildAdminQuickActionHref('/admin', '/')).toBe('/admin');
  });

  it('exposes every sidebar function group in the right-side page action dropdown', () => {
    render(<AdminPageQuickActions />);

    const select = screen.getByLabelText('后台页内功能快速跳转');

    expect(within(select).getByRole('option', { name: '页内功能' })).toBeTruthy();
    expect(within(select).getByRole('option', { name: '产品列表' })).toBeTruthy();
    expect(within(select).getByRole('option', { name: '产品大类' })).toBeTruthy();
    expect(within(select).getByRole('option', { name: '解决方案' })).toBeTruthy();
    expect(within(select).getByRole('option', { name: '咨询与招商记录' })).toBeTruthy();
    expect(within(select).getByRole('option', { name: '站点设置' })).toBeTruthy();
    expect(adminQuickActionGroups.flatMap((group) => group.items)).toHaveLength(17);
  });
});

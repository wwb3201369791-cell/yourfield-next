// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DashboardReady } from '@/components/admin/dashboard/DashboardReady';
import type { DashboardState } from '@/components/admin/dashboard/types';

vi.mock('@payloadcms/ui', () => ({
  useAuth: () => ({
    user: {
      email: 'ops@example.com',
      name: '运营同事',
    },
  }),
  useTranslation: () => ({ i18n: { language: 'zh' } }),
}));

const dashboardState: DashboardState = {
  formSubmissions: { docs: [], totalDocs: 3 },
  health: { computedAt: '2026-05-30T00:00:00.000Z', items: [], level: 'good', score: 100 },
  newFormSubmissions: { docs: [], totalDocs: 1 },
  overdueFormSubmissions: { docs: [], totalDocs: 0 },
  previousFormSubmissions: { docs: [], totalDocs: 2 },
  previousNewFormSubmissions: { docs: [], totalDocs: 0 },
  previousProductGroups: { docs: [], totalDocs: 2 },
  previousProducts: { docs: [], totalDocs: 6 },
  previousSearchLogs: { docs: [], totalDocs: 0 },
  productGroups: { docs: [], totalDocs: 2 },
  products: { docs: [], totalDocs: 8 },
  searchLogs: { docs: [], totalDocs: 0 },
  searchStats: {
    ctr: 0,
    ok: true,
    topKeywords: [],
    totalClicks: 0,
    totalSearches: 0,
    zeroResultSearches: 0,
  },
};

afterEach(() => {
  cleanup();
});

describe('DashboardReady layout', () => {
  it('places quick links before the operations dashboard content', () => {
    render(
      <DashboardReady
        adminBase="/admin"
        apiBase="/api"
        data={dashboardState}
        onRangeChange={vi.fn()}
        onRefresh={vi.fn()}
        rangeDays={7}
        refreshing={false}
      />,
    );

    const quickLinks = screen.getByRole('navigation', { name: '快捷入口' });
    const dashboard = document.querySelector('.yourfield-ops-dashboard');

    expect(dashboard).toBeTruthy();
    expect(dashboard?.contains(quickLinks)).toBe(false);
    expect(
      quickLinks.compareDocumentPosition(dashboard as Element) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /新建产品/ }).getAttribute('href')).toBe(
      '/admin/collections/products/create',
    );
  });
});

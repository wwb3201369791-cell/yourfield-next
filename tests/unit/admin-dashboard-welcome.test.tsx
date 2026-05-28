// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  adminDisplayName,
  dashboardGreeting,
  DashboardWelcome,
} from '@/components/admin/dashboard/sections/DashboardWelcome';
import type { DashboardState } from '@/components/admin/dashboard/types';

vi.mock('payload/dist/admin/components/utilities/Auth', () => ({
  useAuth: () => ({
    user: {
      email: 'wuwenbin@example.com',
      name: '吴文斌',
    },
  }),
}));

const dashboardState: DashboardState = {
  formSubmissions: { docs: [], totalDocs: 8 },
  health: { computedAt: '2026-05-24T00:00:00.000Z', items: [], level: 'good', score: 100 },
  newFormSubmissions: { docs: [], totalDocs: 2 },
  overdueFormSubmissions: { docs: [], totalDocs: 0 },
  previousFormSubmissions: { docs: [], totalDocs: 4 },
  previousNewFormSubmissions: { docs: [], totalDocs: 1 },
  previousProductGroups: { docs: [], totalDocs: 4 },
  previousProducts: { docs: [], totalDocs: 10 },
  previousSearchLogs: { docs: [], totalDocs: 3 },
  productGroups: { docs: [], totalDocs: 4 },
  products: { docs: [], totalDocs: 12 },
  searchLogs: { docs: [], totalDocs: 3 },
  searchStats: {
    ctr: 0.25,
    ok: true,
    topKeywords: [],
    totalClicks: 1,
    totalSearches: 4,
    zeroResultSearches: 1,
  },
};

afterEach(() => {
  cleanup();
});

describe('DashboardWelcome', () => {
  it('uses stable Chinese greetings by time of day', () => {
    expect(dashboardGreeting(new Date('2026-05-24T08:00:00+08:00'))).toBe('早上好');
    expect(dashboardGreeting(new Date('2026-05-24T14:00:00+08:00'))).toBe('下午好');
    expect(dashboardGreeting(new Date('2026-05-24T20:00:00+08:00'))).toBe('晚上好');
  });

  it('chooses a readable admin display name', () => {
    expect(adminDisplayName({ email: 'ops@example.com', name: '  ' })).toBe('ops');
    expect(adminDisplayName({ email: '', username: 'operator' })).toBe('operator');
    expect(adminDisplayName(null)).toBe('用户');
  });

  it('summarizes existing dashboard state without extra requests', () => {
    render(
      <DashboardWelcome
        adminBase="/admin"
        data={dashboardState}
        now={new Date('2026-05-24T09:00:00+08:00')}
        rangeLabel="近7天"
      />,
    );

    expect(screen.getByText('早上好，吴文斌')).toBeTruthy();
    expect(screen.getByText('今天优先处理 2 条新咨询')).toBeTruthy();
    expect(screen.getByText('近7天共收到 8 条询盘；站内搜索有 1 次零结果。')).toBeTruthy();
    expect(screen.getByRole('link', { name: /查看新咨询/ }).getAttribute('href')).toBe(
      '/admin/collections/form-submissions?where%5Bstatus%5D%5Bequals%5D=new',
    );
  });
});

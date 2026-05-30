// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminDashboardIntro, AdminLoginIntro, AdminNavBrand } from '@/components/admin/AdminBrand';

const i18nMock = vi.hoisted(() => ({ language: 'zh' }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: i18nMock }),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  i18nMock.language = 'zh';
});

describe('AdminBrand bilingual copy', () => {
  it('renders English copy when the admin interface language is English', () => {
    i18nMock.language = 'en';

    render(
      <>
        <AdminLoginIntro />
        <AdminNavBrand />
        <AdminDashboardIntro />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.getAllByText('YourField Admin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: 'Back to YourField admin home' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Today’s Operations Workspace' })).toBeTruthy();
    expect(screen.queryByText('YourField Operations Admin')).toBeNull();
  });

  it('keeps the Chinese dashboard hero focused on the workspace title', () => {
    render(<AdminDashboardIntro />);

    expect(screen.getByRole('heading', { name: '今日运营工作台' })).toBeTruthy();
    expect(
      screen.getByText('集中查看询盘跟进、内容更新与产品展示状态，优先处理今天最要紧的事项。'),
    ).toBeTruthy();
    expect(screen.queryByText('永霏运营后台')).toBeNull();
  });
});

// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
  user: undefined as undefined | { id: string },
}));
const localeState = vi.hoisted(() => ({
  locale: { code: 'zh' },
}));
const preferenceState = vi.hoisted(() => ({
  setPreference: vi.fn(async () => undefined),
}));

vi.mock('payload/dist/admin/components/utilities/Auth', () => ({
  useAuth: () => ({
    user: authState.user,
  }),
}));

vi.mock('payload/dist/admin/components/utilities/Locale', () => ({
  useLocale: () => localeState.locale,
}));

vi.mock('payload/dist/admin/components/utilities/Preferences', () => ({
  usePreferences: () => ({
    setPreference: preferenceState.setPreference,
  }),
}));

import { AdminLocaleGuard } from '@/components/admin/AdminLocaleGuard';

afterEach(() => {
  cleanup();
  authState.user = undefined;
  localeState.locale = { code: 'zh' };
  preferenceState.setPreference.mockClear();
});

describe('AdminLocaleGuard', () => {
  it('renders children without writing preferences before an admin user is authenticated', () => {
    render(
      <AdminLocaleGuard>
        <div>后台内容</div>
      </AdminLocaleGuard>,
    );

    expect(screen.getByText('后台内容')).toBeTruthy();
    expect(preferenceState.setPreference).not.toHaveBeenCalled();
  });

  it('persists the fixed admin content locale after an admin user is authenticated', async () => {
    authState.user = { id: 'user-1' };

    render(
      <AdminLocaleGuard>
        <div>后台内容</div>
      </AdminLocaleGuard>,
    );

    await waitFor(() => {
      expect(preferenceState.setPreference).toHaveBeenCalledWith('locale', 'zh');
    });
  });
});

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AdminInterfaceLanguageSwitch,
  asAdminInterfaceLocale,
} from '@/components/admin/AdminInterfaceLanguageSwitch';
import { adminUiText } from '@/components/admin/adminUiLocale';

const translationMock = vi.hoisted(() => {
  const i18n = { language: 'zh' };
  const switchLanguage = vi.fn((language: string) => {
    i18n.language = language;
    return Promise.resolve();
  });

  return { i18n, switchLanguage };
});

vi.mock('@payloadcms/ui', () => ({
  useTranslation: () => translationMock,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  translationMock.switchLanguage.mockClear();
  translationMock.i18n.language = 'zh';
  window.localStorage.clear();
});

describe('AdminInterfaceLanguageSwitch', () => {
  it('normalizes admin UI language to Chinese or English only', () => {
    expect(asAdminInterfaceLocale('zh-CN')).toBe('zh');
    expect(asAdminInterfaceLocale('en-US')).toBe('en');
    expect(asAdminInterfaceLocale('ru')).toBe('zh');
  });

  it('falls back safely for missing bilingual admin copy', () => {
    expect(adminUiText('zh', undefined)).toBe('');
    expect(adminUiText('zh', { en: 'Cover image' })).toBe('Cover image');
    expect(adminUiText('en', { zh: '方案主图' })).toBe('方案主图');
  });

  it('switches and persists admin interface language without touching content locale controls', () => {
    render(<AdminInterfaceLanguageSwitch />);

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(translationMock.switchLanguage).toHaveBeenCalledWith('en');
    expect(window.localStorage.getItem('lng')).toBe('en');
    expect(document.cookie).toContain('lng=en');
    expect(document.cookie).toContain('payload-lng=en');
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByLabelText('Switch admin interface language')).toBeTruthy();
  });

  it('hydrates Payload admin language from persisted preference on first render', async () => {
    window.localStorage.setItem('lng', 'en');
    document.cookie = 'payload-lng=en; path=/';

    render(<AdminInterfaceLanguageSwitch />);

    expect(screen.getByLabelText('Switch admin interface language')).toBeTruthy();
    await waitFor(() => expect(translationMock.switchLanguage).toHaveBeenCalledWith('en'));
  });
});

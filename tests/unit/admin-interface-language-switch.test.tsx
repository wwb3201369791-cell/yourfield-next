// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AdminInterfaceLanguageSwitch,
  asAdminInterfaceLocale,
} from '@/components/admin/AdminInterfaceLanguageSwitch';

const i18nMock = vi.hoisted(() => {
  const listeners = new Set<(language: string) => void>();
  const i18n = {
    changeLanguage: vi.fn((language: string) => {
      i18n.language = language;
      listeners.forEach((listener) => listener(language));
      return Promise.resolve();
    }),
    language: 'zh',
    off: vi.fn((_event: string, listener: (language: string) => void) => {
      listeners.delete(listener);
    }),
    on: vi.fn((_event: string, listener: (language: string) => void) => {
      listeners.add(listener);
    }),
  };

  return i18n;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: i18nMock }),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  i18nMock.changeLanguage.mockClear();
  i18nMock.language = 'zh';
  window.localStorage.clear();
});

describe('AdminInterfaceLanguageSwitch', () => {
  it('normalizes admin UI language to Chinese or English only', () => {
    expect(asAdminInterfaceLocale('zh-CN')).toBe('zh');
    expect(asAdminInterfaceLocale('en-US')).toBe('en');
    expect(asAdminInterfaceLocale('ru')).toBe('zh');
  });

  it('switches and persists admin interface language without touching content locale controls', () => {
    render(<AdminInterfaceLanguageSwitch />);

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(i18nMock.changeLanguage).toHaveBeenCalledWith('en');
    expect(window.localStorage.getItem('lng')).toBe('en');
    expect(document.cookie).toContain('lng=en');
    expect(screen.getByLabelText('Switch admin interface language')).toBeTruthy();
  });
});

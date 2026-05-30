// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AdminInterfaceLanguageSwitch,
  asAdminInterfaceLocale,
} from '@/components/admin/AdminInterfaceLanguageSwitch';

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

  it('switches and persists admin interface language without touching content locale controls', () => {
    render(<AdminInterfaceLanguageSwitch />);

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(translationMock.switchLanguage).toHaveBeenCalledWith('en');
    expect(window.localStorage.getItem('lng')).toBe('en');
    expect(document.cookie).toContain('lng=en');
    expect(screen.getByLabelText('Switch admin interface language')).toBeTruthy();
  });
});

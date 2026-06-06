// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LanguageSwitcher } from '@/components/header/LanguageSwitcher';

const navigationMocks = vi.hoisted(() => ({
  pathname: '/zh/search',
  push: vi.fn(),
  query: 'q=%E9%98%BB%E7%87%83&type=products',
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigationMocks.pathname,
  useRouter: () => ({
    push: navigationMocks.push,
  }),
  useSearchParams: () => new URLSearchParams(navigationMocks.query),
}));

vi.mock('@/lib/i18n/useTranslations', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    navigationMocks.pathname = '/zh/search';
    navigationMocks.query = 'q=%E9%98%BB%E7%87%83&type=products';
    navigationMocks.push.mockClear();
    document.documentElement.lang = 'zh-CN';
    document.cookie = 'yourfield.locale=; max-age=0; path=/';
  });

  afterEach(() => {
    cleanup();
  });

  it('preserves the current search query when switching locales', () => {
    render(<LanguageSwitcher locale="zh" />);

    fireEvent.click(screen.getByRole('button', { name: 'language.label' }));
    fireEvent.click(screen.getByRole('option', { name: /English/ }));

    expect(navigationMocks.push).toHaveBeenCalledWith(
      '/en/search?q=%E9%98%BB%E7%87%83&type=products',
    );
    expect(document.documentElement.lang).toBe('en');
  });

  it('does not append an empty question mark when no query exists', () => {
    navigationMocks.pathname = '/zh/products';
    navigationMocks.query = '';

    render(<LanguageSwitcher locale="zh" />);

    fireEvent.click(screen.getByRole('button', { name: 'language.label' }));
    fireEvent.click(screen.getByRole('option', { name: /Русский/ }));

    expect(navigationMocks.push).toHaveBeenCalledWith('/ru/products');
  });
});

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React, { type ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Header } from '@/components/header/Header';
import type { SiteNavigationItem } from '@/lib/navigation';

const routerMocks = vi.hoisted(() => ({
  prefetch: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    priority: _priority,
    src,
    unoptimized: _unoptimized,
    ...props
  }: ComponentProps<'img'> & {
    fill?: boolean;
    priority?: boolean;
    unoptimized?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ''} src={String(src)} {...props} />
  ),
}));

type MockLinkProps = ComponentProps<'a'> & {
  href: string;
  prefetch?: boolean;
};

vi.mock('next/link', () => ({
  default: ({ children, href, prefetch, ...props }: MockLinkProps) => (
    <a href={href} data-prefetch={String(prefetch)} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/zh',
  useRouter: () => ({
    prefetch: routerMocks.prefetch,
  }),
}));

vi.mock('@/lib/i18n/useTranslations', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/header/SearchTrigger', () => ({
  SearchTrigger: () => <div data-testid="search-trigger" />,
}));

vi.mock('@/components/header/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

const navigation: readonly SiteNavigationItem[] = [
  {
    href: '/',
    isContact: false,
    key: 'home',
    label: '首页',
    target: '_self',
  },
  {
    href: '/about',
    isContact: false,
    key: 'about',
    label: '关于我们',
    target: '_self',
  },
  {
    href: '/products',
    isContact: false,
    key: 'products',
    label: '产品中心',
    target: '_self',
  },
];

describe('Header navigation prefetching', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', 'http://localhost:3000/zh');
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
    routerMocks.prefetch.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('does not fetch every navigation page after the header mounts', () => {
    render(<Header locale="zh" navigation={navigation} />);

    vi.advanceTimersByTime(5000);

    expect(fetch).not.toHaveBeenCalled();
    expect(routerMocks.prefetch).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: '关于我们' }).getAttribute('data-prefetch')).toBe(
      'false',
    );
  });

  it('does not prefetch navigation pages on local hosts', () => {
    render(<Header locale="zh" navigation={navigation} />);

    fireEvent.mouseEnter(screen.getByRole('link', { name: '关于我们' }));

    expect(fetch).not.toHaveBeenCalled();
    expect(routerMocks.prefetch).not.toHaveBeenCalled();
  });

});

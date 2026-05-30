import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as PreviewExitRoute from '@/app/(site)/api/preview/exit/route';

type RouteModule = typeof PreviewExitRoute;

const createDraftModeStub = () => ({
  disable: vi.fn(),
  enable: vi.fn(),
  isEnabled: true,
});

const loadRoute = async () => {
  const draftModeStub = createDraftModeStub();

  vi.resetModules();
  vi.doMock('@/lib/env', () => ({
    env: {
      NEXT_PUBLIC_DEFAULT_LOCALE: 'zh',
      NEXT_PUBLIC_LOCALES: ['zh', 'en', 'ru'],
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3000',
    },
  }));
  vi.doMock('next/headers', () => ({
    draftMode: vi.fn(() => draftModeStub),
  }));

  const route: RouteModule = await import('@/app/(site)/api/preview/exit/route');

  return { draftModeStub, route };
};

const exitRequest = (query: Record<string, string> = {}) => {
  const url = new URL('http://localhost:3000/api/preview/exit');

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  return new NextRequest(url);
};

afterEach(() => {
  vi.doUnmock('@/lib/env');
  vi.doUnmock('next/headers');
  vi.resetModules();
});

describe('GET /api/preview/exit (HTTP contract)', () => {
  it('disables Draft Mode and 307-redirects to the default locale home by default', async () => {
    const { draftModeStub, route } = await loadRoute();

    const response = await route.GET(exitRequest());

    expect(response.status).toBe(307);
    expect(draftModeStub.disable).toHaveBeenCalledTimes(1);

    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    expect(new URL(location ?? '').pathname).toBe('/zh');
  });

  it('honors safe internal redirect paths passed via ?redirect=', async () => {
    const { route } = await loadRoute();

    const response = await route.GET(
      exitRequest({ redirect: '/en/products/firefighter-suit-combat' }),
    );

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location ?? '');
    expect(url.host).toBe('localhost:3000');
    expect(url.pathname).toBe('/en/products/firefighter-suit-combat');
  });

  it('rejects protocol-relative open-redirect attempts and falls back to the default locale', async () => {
    const { route } = await loadRoute();

    const response = await route.GET(exitRequest({ redirect: '//evil.example/steal' }));

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location ?? '');
    expect(url.host).toBe('localhost:3000');
    expect(url.host).not.toContain('evil.example');
    expect(url.pathname).toBe('/zh');
  });

  it('rejects fully-qualified external URLs and falls back to the default locale', async () => {
    const { route } = await loadRoute();

    const response = await route.GET(exitRequest({ redirect: 'https://evil.example/steal' }));

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location ?? '');
    expect(url.host).toBe('localhost:3000');
    expect(url.pathname).toBe('/zh');
  });

  it('accepts redirect via the legacy ?next= query parameter', async () => {
    const { route } = await loadRoute();

    const response = await route.GET(exitRequest({ next: '/en' }));

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(new URL(location ?? '').pathname).toBe('/en');
  });

  it('treats ?next=//evil.example as unsafe and falls back to the default locale', async () => {
    const { route } = await loadRoute();

    const response = await route.GET(exitRequest({ next: '//evil.example' }));

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    const url = new URL(location ?? '');
    expect(url.host).toBe('localhost:3000');
    expect(url.host).not.toContain('evil.example');
  });
});

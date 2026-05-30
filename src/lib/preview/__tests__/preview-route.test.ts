import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as PreviewRoute from '@/app/(site)/api/preview/route';

type RouteModule = typeof PreviewRoute;

type PayloadFindArgs = {
  collection: string;
  depth?: number;
  draft?: boolean;
  fallbackLocale?: string;
  limit?: number;
  locale?: string;
  overrideAccess?: boolean;
  where?: unknown;
};

type PreviewDocument = Record<string, unknown>;

const createPayloadStub = (docs: PreviewDocument[] = []) => ({
  find: vi.fn((_args: PayloadFindArgs) => Promise.resolve({ docs })),
});

const createDraftModeStub = () => ({
  disable: vi.fn(),
  enable: vi.fn(),
  isEnabled: false,
});

type PayloadStub = ReturnType<typeof createPayloadStub>;

type LoadRouteOptions = {
  payload?: PayloadStub;
  secret?: string;
};

const loadRoute = async ({
  payload = createPayloadStub(),
  secret = 'expected-preview-secret',
}: LoadRouteOptions = {}) => {
  const draftModeStub = createDraftModeStub();

  vi.resetModules();
  vi.doMock('@/lib/env', () => ({
    env: {
      NEXT_PUBLIC_DEFAULT_LOCALE: 'zh',
      NEXT_PUBLIC_LOCALES: ['zh', 'en', 'ru'],
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3000',
      PAYLOAD_PREVIEW_SECRET: secret,
    },
  }));
  vi.doMock('@/lib/cms/payload', () => ({
    getPayloadClient: vi.fn(() => Promise.resolve(payload)),
  }));
  vi.doMock('next/headers', () => ({
    draftMode: vi.fn(() => draftModeStub),
  }));

  const route: RouteModule = await import('@/app/(site)/api/preview/route');

  return { draftModeStub, payload, route };
};

const previewRequest = (query: Record<string, string | undefined>, headers?: HeadersInit) => {
  const url = new URL('http://localhost:3000/api/preview');

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return new NextRequest(url, headers ? { headers } : undefined);
};

const responseJson = async (response: Response) => {
  const body: unknown = await response.json();

  return body;
};

const firstFindCall = (payload: PayloadStub): PayloadFindArgs => {
  const call = payload.find.mock.calls[0]?.[0];
  if (!call) {
    throw new Error('Expected Payload find to be called.');
  }

  return call;
};

afterEach(() => {
  vi.doUnmock('@/lib/cms/payload');
  vi.doUnmock('@/lib/env');
  vi.doUnmock('next/headers');
  vi.resetModules();
});

describe('GET /api/preview', () => {
  it('rejects an invalid token before querying Payload or enabling Draft Mode', async () => {
    const { draftModeStub, payload, route } = await loadRoute();

    const response = await route.GET(
      previewRequest({
        collection: 'products',
        locale: 'zh',
        slug: 'firefighter-suit-combat',
        token: 'wrong-preview-secret',
      }),
    );

    expect(response.status).toBe(401);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'INVALID_TOKEN' },
      ok: false,
    });
    expect(payload.find).not.toHaveBeenCalled();
    expect(draftModeStub.enable).not.toHaveBeenCalled();
  });

  it('looks up preview targets with draft enabled and keeps Draft Mode disabled when not found', async () => {
    const payload = createPayloadStub([]);
    const { draftModeStub, route } = await loadRoute({ payload });

    const response = await route.GET(
      previewRequest({
        collection: 'products',
        locale: 'en',
        slug: 'draft-only-product',
        token: 'expected-preview-secret',
      }),
    );

    expect(response.status).toBe(404);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'NOT_FOUND' },
      ok: false,
    });
    expect(firstFindCall(payload)).toMatchObject({
      collection: 'products',
      draft: true,
      locale: 'en',
      overrideAccess: true,
      where: { slug: { equals: 'draft-only-product' } },
    });
    expect(draftModeStub.enable).not.toHaveBeenCalled();
  });

  it('enables Draft Mode and redirects to a locale-scoped preview URL for valid targets', async () => {
    const payload = createPayloadStub([{ id: 'product-1' }]);
    const { draftModeStub, route } = await loadRoute({ payload });

    const response = await route.GET(
      previewRequest({
        collection: 'products',
        locale: 'en',
        slug: 'draft-only-product',
        token: 'expected-preview-secret',
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/en/products/draft-only-product?preview=1',
    );
    expect(firstFindCall(payload)).toMatchObject({
      collection: 'products',
      draft: true,
      locale: 'en',
      overrideAccess: true,
      where: { slug: { equals: 'draft-only-product' } },
    });
    expect(draftModeStub.enable).toHaveBeenCalledTimes(1);
  });

  it('uses the request host when building the same-origin preview redirect', async () => {
    const payload = createPayloadStub([{ id: 'product-1' }]);
    const { route } = await loadRoute({ payload });

    const response = await route.GET(
      previewRequest(
        {
          collection: 'products',
          locale: 'en',
          slug: 'draft-only-product',
          token: 'expected-preview-secret',
        },
        { host: 'localhost:3100' },
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3100/en/products/draft-only-product?preview=1',
    );
  });

  it('does not trust unlisted forwarded hosts for preview redirects', async () => {
    const payload = createPayloadStub([{ id: 'product-1' }]);
    const { route } = await loadRoute({ payload });

    const response = await route.GET(
      previewRequest(
        {
          collection: 'products',
          locale: 'en',
          slug: 'draft-only-product',
          token: 'expected-preview-secret',
        },
        {
          host: 'localhost:3000',
          'x-forwarded-host': 'evil.example',
          'x-forwarded-proto': 'https',
        },
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/en/products/draft-only-product?preview=1',
    );
  });
});

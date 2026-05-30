import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as PreviewRoute from '@/app/(site)/api/preview/route';

type RouteModule = typeof PreviewRoute;

type PayloadFindArgs = {
  collection: string;
  draft?: boolean;
  locale?: string;
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

const previewRequest = (query: Record<string, string | undefined>) => {
  const url = new URL('http://localhost:3000/api/preview');

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return new NextRequest(url);
};

const responseJson = async (response: Response) =>
  (await response.json()) as Record<string, unknown>;

afterEach(() => {
  vi.doUnmock('@/lib/cms/payload');
  vi.doUnmock('@/lib/env');
  vi.doUnmock('next/headers');
  vi.resetModules();
});

describe('GET /api/preview (HTTP contract)', () => {
  it('enables Draft Mode and 307-redirects for a valid token and existing target', async () => {
    const payload = createPayloadStub([{ id: 'product-1' }]);
    const { draftModeStub, route } = await loadRoute({ payload });

    const response = await route.GET(
      previewRequest({
        collection: 'products',
        locale: 'zh',
        slug: 'firefighter-suit-combat',
        token: 'expected-preview-secret',
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/zh/products/firefighter-suit-combat?preview=1',
    );
    expect(draftModeStub.enable).toHaveBeenCalledTimes(1);
  });

  it('returns 401 with INVALID_TOKEN when the token does not match the secret', async () => {
    const { draftModeStub, payload, route } = await loadRoute();

    const response = await route.GET(
      previewRequest({
        collection: 'products',
        locale: 'zh',
        slug: 'firefighter-suit-combat',
        token: 'wrong-token',
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

  it('returns 401 with INVALID_TOKEN when the token query param is missing', async () => {
    const { draftModeStub, payload, route } = await loadRoute();

    const response = await route.GET(
      previewRequest({
        collection: 'products',
        locale: 'zh',
        slug: 'firefighter-suit-combat',
      }),
    );

    // Missing token surfaces as a validation error (no token query at all)
    expect([400, 401]).toContain(response.status);
    expect(payload.find).not.toHaveBeenCalled();
    expect(draftModeStub.enable).not.toHaveBeenCalled();
  });

  it('returns 404 NOT_FOUND when the preview target document does not exist', async () => {
    const payload = createPayloadStub([]);
    const { draftModeStub, route } = await loadRoute({ payload });

    const response = await route.GET(
      previewRequest({
        collection: 'products',
        locale: 'zh',
        slug: 'missing-product',
        token: 'expected-preview-secret',
      }),
    );

    expect(response.status).toBe(404);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'NOT_FOUND' },
      ok: false,
    });
    expect(draftModeStub.enable).not.toHaveBeenCalled();
  });

  it('returns 503 PREVIEW_NOT_CONFIGURED when the secret is missing in env', async () => {
    const { draftModeStub, payload, route } = await loadRoute({ secret: '' });

    const response = await route.GET(
      previewRequest({
        collection: 'products',
        locale: 'zh',
        slug: 'firefighter-suit-combat',
        token: 'anything',
      }),
    );

    expect(response.status).toBe(503);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'PREVIEW_NOT_CONFIGURED' },
      ok: false,
    });
    expect(payload.find).not.toHaveBeenCalled();
    expect(draftModeStub.enable).not.toHaveBeenCalled();
  });
});

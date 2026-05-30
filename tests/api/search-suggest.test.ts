import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as SearchSuggestRoute from '@/app/(site)/api/search/suggest/route';

type RouteModule = typeof SearchSuggestRoute;

type PayloadFindArgs = {
  collection: string;
  draft?: boolean;
  locale?: string;
  where?: unknown;
};

const createPayloadStub = () => ({
  create: vi.fn(() => Promise.resolve({ id: 'search-log-1' })),
  find: vi.fn((args: PayloadFindArgs) => {
    if (args.collection === 'products') {
      return Promise.resolve({
        docs: [
          {
            category: { categoryId: 'firefighter', group: 'fire-rescue', name: '消防防护' },
            id: 'product-1',
            model: 'HYF-5506',
            name: '消防员灭火防护服',
            productId: 'firefighter-suit-combat',
            sku: 'HYF-5506',
            slug: 'firefighter-suit-combat',
          },
        ],
      });
    }

    return Promise.resolve({ docs: [] });
  }),
});

type PayloadStub = ReturnType<typeof createPayloadStub>;

type LoadRouteOptions = {
  payload?: PayloadStub;
  rateLimitAllowed?: boolean;
};

const loadRoute = async ({
  payload = createPayloadStub(),
  rateLimitAllowed = true,
}: LoadRouteOptions = {}) => {
  const checkSearchRateLimit = vi.fn(() => ({
    allowed: rateLimitAllowed,
    retryAfterSeconds: 30,
  }));

  vi.resetModules();
  vi.doMock('next/cache', () => ({
    unstable_cache: (fn: unknown) => fn,
  }));
  vi.doMock('@/lib/cms/payload', () => ({
    getPayloadClient: vi.fn(() => Promise.resolve(payload)),
  }));
  vi.doMock('@/lib/search/request', () => ({
    checkSearchRateLimit,
    getSearchClientIp: vi.fn(() => '198.51.100.43'),
  }));

  const route: RouteModule = await import('@/app/(site)/api/search/suggest/route');

  return { checkSearchRateLimit, payload, route };
};

const suggestRequest = (query: Record<string, string>) => {
  const url = new URL('http://localhost:3000/api/search/suggest');

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  return new NextRequest(url);
};

const responseJson = async (response: Response) =>
  (await response.json()) as Record<string, unknown>;

afterEach(() => {
  vi.doUnmock('@/lib/cms/payload');
  vi.doUnmock('@/lib/search/request');
  vi.doUnmock('next/cache');
  vi.resetModules();
});

describe('GET /api/search/suggest (HTTP contract)', () => {
  it('200 happy path: returns suggestions for a valid prefix without writing search logs', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.GET(
      suggestRequest({
        limit: '5',
        locale: 'zh',
        q: '消',
      }),
    );

    expect(response.status).toBe(200);
    const body = await responseJson(response);
    expect(body).toMatchObject({
      locale: 'zh',
      ok: true,
      query: '消',
    });
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('400 VALIDATION_ERROR for unsupported locales before the limiter or Payload is touched', async () => {
    const { checkSearchRateLimit, payload, route } = await loadRoute();

    const response = await route.GET(
      suggestRequest({
        limit: '5',
        locale: 'de',
        q: '消防',
      }),
    );

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
      ok: false,
    });
    expect(checkSearchRateLimit).not.toHaveBeenCalled();
    expect(payload.find).not.toHaveBeenCalled();
  });

  it('400 VALIDATION_ERROR when limit exceeds the allowed maximum', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.GET(
      suggestRequest({
        limit: '99',
        locale: 'zh',
        q: '消防',
      }),
    );

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
      ok: false,
    });
    expect(payload.find).not.toHaveBeenCalled();
  });

  it('429 RATE_LIMITED with Retry-After header when the rate limiter rejects the request', async () => {
    const { payload, route } = await loadRoute({ rateLimitAllowed: false });

    const response = await route.GET(
      suggestRequest({
        limit: '5',
        locale: 'zh',
        q: '消',
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBeTruthy();
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'RATE_LIMITED' },
      ok: false,
    });
    expect(payload.find).not.toHaveBeenCalled();
  });
});

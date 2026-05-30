import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as SearchClickRoute from '@/app/(site)/api/search/click/route';

type RouteModule = typeof SearchClickRoute;

type PayloadCreateArgs = {
  collection: string;
  data: Record<string, unknown>;
  overrideAccess?: boolean;
};

const createPayloadStub = () => ({
  create: vi.fn((_args: PayloadCreateArgs) => Promise.resolve({ id: 'search-click-1' })),
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
  vi.doMock('@/lib/cms/payload', () => ({
    getPayloadClient: vi.fn(() => Promise.resolve(payload)),
  }));
  vi.doMock('@/lib/search/request', () => ({
    checkSearchRateLimit,
    getSearchClientIp: vi.fn(() => '198.51.100.42'),
  }));

  const route: RouteModule = await import('@/app/(site)/api/search/click/route');

  return { checkSearchRateLimit, payload, route };
};

const clickRequest = (body: unknown, headers?: Record<string, string>) =>
  new NextRequest('http://localhost:3000/api/search/click', {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    method: 'POST',
  });

const validClickBody = (overrides: Record<string, unknown> = {}) => ({
  hits: 1,
  locale: 'zh',
  query: 'HYF',
  result: {
    id: 'firefighter-suit-combat',
    title: '消防员灭火防护服',
    type: 'product',
    url: '/zh/products/firefighter-suit-combat',
  },
  ...overrides,
});

const responseJson = async (response: Response) =>
  (await response.json()) as Record<string, unknown>;

afterEach(() => {
  vi.doUnmock('@/lib/cms/payload');
  vi.doUnmock('@/lib/search/request');
  vi.resetModules();
});

describe('POST /api/search/click (HTTP contract)', () => {
  it('200 happy path: records a click for a safe internal result URL', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.POST(clickRequest(validClickBody()));

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toEqual({ ok: true });
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'search-logs',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- nested expect.objectContaining returns any from vitest's matcher typings
        data: expect.objectContaining({
          eventType: 'result-click',
          locale: 'zh',
          query: 'HYF',
          resultId: 'firefighter-suit-combat',
          resultUrl: '/zh/products/firefighter-suit-combat',
        }),
        overrideAccess: true,
      }),
    );
  });

  it('400 VALIDATION_ERROR when the result URL points outside the site', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.POST(
      clickRequest(
        validClickBody({
          result: {
            id: 'firefighter-suit-combat',
            title: '消防员灭火防护服',
            type: 'product',
            url: 'https://evil.example/zh/products/firefighter-suit-combat',
          },
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
      ok: false,
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('400 VALIDATION_ERROR when locale does not match the result URL locale', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.POST(
      clickRequest(
        validClickBody({
          locale: 'en',
          result: {
            id: 'firefighter-suit-combat',
            title: '消防员灭火防护服',
            type: 'product',
            url: '/zh/products/firefighter-suit-combat',
          },
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
      ok: false,
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('429 RATE_LIMITED with Retry-After header when the rate limiter rejects the request', async () => {
    const { payload, route } = await loadRoute({ rateLimitAllowed: false });

    const response = await route.POST(clickRequest(validClickBody()));

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBeTruthy();
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'RATE_LIMITED' },
      ok: false,
    });
    expect(payload.create).not.toHaveBeenCalled();
  });
});

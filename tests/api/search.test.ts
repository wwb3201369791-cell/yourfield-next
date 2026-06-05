import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

type PayloadFindArgs = {
  collection: string;
  depth?: number;
  draft?: boolean;
  fallbackLocale?: string;
  limit?: number;
  locale?: string;
  overrideAccess?: boolean;
  pagination?: boolean;
  where?: unknown;
};

const createPayloadStub = () => ({
  create: vi.fn(async () => ({ id: 'search-log-1' })),
  find: vi.fn(async (args: PayloadFindArgs) => {
    if (args.collection === 'products') {
      return {
        docs: [
          {
            category: { categoryId: 'firefighter', group: 'fire-rescue', name: '消防防护' },
            description: {
              root: {
                children: [{ children: [{ text: '消防员灭火防护服，适合消防救援。' }] }],
              },
            },
            id: 'product-db-1',
            images: [{ file: { url: '/media/firefighter-suit-combat.jpg' } }],
            model: 'HYF-5506',
            name: '消防员灭火防护服',
            productId: 'firefighter-suit-combat',
            sku: 'HYF-5506',
            slug: 'firefighter-suit-combat',
          },
        ],
      };
    }

    return { docs: [] };
  }),
});

type PayloadStub = ReturnType<typeof createPayloadStub>;

const loadRoute = async (payload: PayloadStub = createPayloadStub()) => {
  vi.resetModules();
  vi.doMock('next/cache', () => ({
    unstable_cache: (fn: unknown) => fn,
  }));
  vi.doMock('@/lib/cms/payload', () => ({
    getPayloadClient: vi.fn(async () => payload),
  }));

  const route = await import('@/app/(site)/api/search/route');

  return { payload, route };
};

const searchRequest = (query: Record<string, string>, headers?: HeadersInit) => {
  const url = new URL('http://localhost:3000/api/search');

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  return new NextRequest(url, headers ? { headers } : undefined);
};

const searchClickRequest = (body: unknown, headers?: Record<string, string>) =>
  new NextRequest('http://localhost:3000/api/search/click', {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    method: 'POST',
  });

const responseJson = async (response: Response) =>
  (await response.json()) as Record<string, unknown>;

afterEach(() => {
  vi.doUnmock('@/lib/cms/payload');
  vi.doUnmock('next/cache');
  vi.resetModules();
});

describe('GET /api/search', () => {
  it('returns 400 for invalid search parameters before querying Payload', async () => {
    const payload = createPayloadStub();
    const { route } = await loadRoute(payload);

    const response = await route.GET(
      searchRequest({
        hitsPerPage: '99',
        locale: 'de',
        q: '消防',
        type: 'bad-type',
      }),
    );

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
      ok: false,
    });
    expect(payload.find).not.toHaveBeenCalled();
  });

  it('returns an empty state for blank queries without querying Payload', async () => {
    const payload = createPayloadStub();
    const { route } = await loadRoute(payload);

    const response = await route.GET(searchRequest({ locale: 'zh', q: '   ' }));

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({
      empty: { reason: 'EMPTY_QUERY' },
      hits: [],
      ok: true,
      totalHits: 0,
    });
    expect(payload.find).not.toHaveBeenCalled();
  });

  it('searches published Payload content and returns the frontend contract shape', async () => {
    const payload = createPayloadStub();
    const { route } = await loadRoute(payload);

    const response = await route.GET(
      searchRequest(
        {
          hitsPerPage: '5',
          locale: 'zh',
          q: 'HYF-5506',
        },
        { 'x-forwarded-for': '198.51.100.24' },
      ),
    );

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({
      hits: [
        {
          productId: 'firefighter-suit-combat',
          title: '消防员灭火防护服',
          type: 'product',
          url: '/zh/products/firefighter-suit-combat',
        },
      ],
      ok: true,
      pagination: {
        hitsPerPage: 5,
        page: 1,
      },
    });
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        draft: false,
        locale: 'zh',
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            { _status: { equals: 'published' } },
            { publishedAt: { greater_than: '1970-01-01T00:00:00.000Z' } },
          ],
        },
      }),
    );

    const productCall = payload.find.mock.calls.find(
      ([args]) => args.collection === 'products',
    )?.[0];
    expect(productCall).not.toHaveProperty('limit');
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'search-logs',
        data: expect.objectContaining({
          hits: 1,
          ip: '198.51.100.24',
          locale: 'zh',
          query: 'HYF-5506',
        }),
        overrideAccess: true,
      }),
    );
  });

  it('normalizes compact model-number queries without separators', async () => {
    const payload = createPayloadStub();
    const { route } = await loadRoute(payload);

    const response = await route.GET(
      searchRequest(
        {
          hitsPerPage: '5',
          locale: 'zh',
          q: 'HYF5506',
        },
        { 'x-forwarded-for': '198.51.100.31' },
      ),
    );

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({
      hits: [
        {
          productId: 'firefighter-suit-combat',
          title: '消防员灭火防护服',
          type: 'product',
          url: '/zh/products/firefighter-suit-combat',
        },
      ],
      ok: true,
      totalHits: 1,
    });
  });

  it('does not write a search log for direct-resolution checks without an exact match', async () => {
    const payload = createPayloadStub();
    const { route } = await loadRoute(payload);

    const response = await route.GET(
      searchRequest(
        {
          direct: '1',
          hitsPerPage: '5',
          locale: 'zh',
          q: '消防',
        },
        { 'x-forwarded-for': '198.51.100.28' },
      ),
    );

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({
      hits: [expect.objectContaining({ title: '消防员灭火防护服' })],
      ok: true,
      totalHits: 1,
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('writes a search log for direct-resolution checks when category navigation requests it', async () => {
    const payload = createPayloadStub();
    const { route } = await loadRoute(payload);

    const response = await route.GET(
      searchRequest(
        {
          direct: '1',
          hitsPerPage: '5',
          locale: 'zh',
          log: '1',
          q: '消防救援防护',
        },
        { 'x-forwarded-for': '198.51.100.30' },
      ),
    );

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({
      ok: true,
      totalHits: 0,
    });
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'search-logs',
        data: expect.objectContaining({
          hits: 0,
          ip: '198.51.100.30',
          locale: 'zh',
          query: '消防救援防护',
        }),
        overrideAccess: true,
      }),
    );
  });

  it('writes a search log for direct-resolution checks with an exact match', async () => {
    const payload = createPayloadStub();
    const { route } = await loadRoute(payload);

    const response = await route.GET(
      searchRequest(
        {
          direct: '1',
          hitsPerPage: '5',
          locale: 'zh',
          q: 'HYF-5506',
        },
        { 'x-forwarded-for': '198.51.100.29' },
      ),
    );

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({
      hits: [expect.objectContaining({ url: '/zh/products/firefighter-suit-combat' })],
      ok: true,
      totalHits: 1,
    });
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'search-logs',
        data: expect.objectContaining({
          hits: 1,
          ip: '198.51.100.29',
          locale: 'zh',
          query: 'HYF-5506',
        }),
        overrideAccess: true,
      }),
    );
  });

  it('returns recommended products for no-result searches', async () => {
    const payload = createPayloadStub();
    const { route } = await loadRoute(payload);

    const response = await route.GET(
      searchRequest(
        {
          hitsPerPage: '5',
          locale: 'zh',
          q: '不存在的型号',
        },
        { 'x-forwarded-for': '198.51.100.27' },
      ),
    );
    const payloadJson = await responseJson(response);

    expect(response.status).toBe(200);
    expect(payloadJson).toMatchObject({
      empty: { reason: 'NO_RESULTS' },
      hits: [],
      ok: true,
      recommendations: {
        products: [
          {
            productId: 'firefighter-suit-combat',
            title: '消防员灭火防护服',
            type: 'product',
            url: '/zh/products/firefighter-suit-combat',
          },
        ],
      },
      totalHits: 0,
    });
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'search-logs',
        data: expect.objectContaining({
          hits: 0,
          ip: '198.51.100.27',
          locale: 'zh',
          query: '不存在的型号',
        }),
        overrideAccess: true,
      }),
    );
  });

  it('keeps search rate-limit buckets separate by forwarded client IP', async () => {
    const { route } = await loadRoute();

    for (let attempt = 0; attempt < 60; attempt += 1) {
      const response = await route.GET(
        searchRequest({ locale: 'zh', q: '' }, { 'x-forwarded-for': '203.0.113.10' }),
      );

      expect(response.status).toBe(200);
    }

    const rateLimitedResponse = await route.GET(
      searchRequest({ locale: 'zh', q: '' }, { 'x-forwarded-for': '203.0.113.10' }),
    );
    const otherClientResponse = await route.GET(
      searchRequest({ locale: 'zh', q: '' }, { 'x-forwarded-for': '203.0.113.11' }),
    );

    expect(rateLimitedResponse.status).toBe(429);
    expect(otherClientResponse.status).toBe(200);
  });
});

describe('GET /api/search/suggest', () => {
  it('returns suggestions from published Payload content without writing search logs', async () => {
    const payload = createPayloadStub();
    vi.resetModules();
    vi.doMock('next/cache', () => ({
      unstable_cache: (fn: unknown) => fn,
    }));
    vi.doMock('@/lib/cms/payload', () => ({
      getPayloadClient: vi.fn(async () => payload),
    }));
    const route = await import('@/app/(site)/api/search/suggest/route');

    const response = await route.GET(
      searchRequest(
        {
          limit: '5',
          locale: 'zh',
          q: '消',
        },
        { 'x-forwarded-for': '198.51.100.25' },
      ),
    );
    const payloadJson = await responseJson(response);

    expect(response.status).toBe(200);
    expect(payloadJson).toMatchObject({
      locale: 'zh',
      ok: true,
      query: '消',
    });
    expect(payloadJson.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          term: '消防员灭火防护服',
          type: 'product',
          url: '/zh/products/firefighter-suit-combat',
        }),
      ]),
    );
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid suggestion parameters before querying Payload', async () => {
    const payload = createPayloadStub();
    vi.resetModules();
    vi.doMock('next/cache', () => ({
      unstable_cache: (fn: unknown) => fn,
    }));
    vi.doMock('@/lib/cms/payload', () => ({
      getPayloadClient: vi.fn(async () => payload),
    }));
    const route = await import('@/app/(site)/api/search/suggest/route');

    const response = await route.GET(
      searchRequest({
        limit: '99',
        locale: 'de',
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
});

describe('POST /api/search/click', () => {
  it('validates click payloads before writing search click logs', async () => {
    const payload = createPayloadStub();
    vi.resetModules();
    vi.doMock('next/cache', () => ({
      unstable_cache: (fn: unknown) => fn,
    }));
    vi.doMock('@/lib/cms/payload', () => ({
      getPayloadClient: vi.fn(async () => payload),
    }));
    const route = await import('@/app/(site)/api/search/click/route');

    const response = await route.POST(
      searchClickRequest({
        hits: 1,
        locale: 'zh',
        query: 'HYF',
        result: {
          id: 'firefighter-suit-combat',
          title: '消防员灭火防护服',
          type: 'product',
          url: 'https://example.com/zh/products/firefighter-suit-combat',
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
      ok: false,
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('writes result-click events for safe internal search result URLs', async () => {
    const payload = createPayloadStub();
    vi.resetModules();
    vi.doMock('next/cache', () => ({
      unstable_cache: (fn: unknown) => fn,
    }));
    vi.doMock('@/lib/cms/payload', () => ({
      getPayloadClient: vi.fn(async () => payload),
    }));
    const route = await import('@/app/(site)/api/search/click/route');

    const response = await route.POST(
      searchClickRequest(
        {
          hits: 1,
          locale: 'zh',
          query: 'HYF',
          result: {
            id: 'firefighter-suit-combat',
            title: '消防员灭火防护服',
            type: 'product',
            url: '/zh/products/firefighter-suit-combat',
          },
        },
        { 'x-forwarded-for': '198.51.100.26' },
      ),
    );

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toEqual({ ok: true });
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'search-logs',
        data: expect.objectContaining({
          eventType: 'result-click',
          hits: 1,
          ip: '198.51.100.26',
          locale: 'zh',
          query: 'HYF',
          resultId: 'firefighter-suit-combat',
          resultType: 'product',
          resultUrl: '/zh/products/firefighter-suit-combat',
        }),
        overrideAccess: true,
      }),
    );
  });
});

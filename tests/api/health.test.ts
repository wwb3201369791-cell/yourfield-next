import { afterEach, describe, expect, it, vi } from 'vitest';

type PayloadFindArgs = {
  collection: string;
  depth?: number;
  limit?: number;
  overrideAccess?: boolean;
  pagination?: boolean;
};

const createPayloadStub = () => ({
  find: vi.fn((_args: PayloadFindArgs) => Promise.resolve({ docs: [] })),
});

type PayloadStub = ReturnType<typeof createPayloadStub>;

const loadRoute = async (payload: PayloadStub = createPayloadStub()) => {
  vi.resetModules();
  vi.doMock('@/lib/cms/payload', () => ({
    getPayloadClient: vi.fn(() => Promise.resolve(payload)),
  }));
  vi.doMock('@/lib/env', () => ({
    env: {
      APP_RELEASE_REVISION: process.env.APP_RELEASE_REVISION,
      APP_VERSION: 'test-version',
    },
  }));

  const route = await import('@/app/(site)/api/health/route');

  return { payload, route };
};

const responseJson = async (response: Response) =>
  (await response.json()) as Record<string, unknown>;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock('@/lib/cms/payload');
  vi.doUnmock('@/lib/env');
  vi.resetModules();
});

describe('GET /api/health', () => {
  it('returns service version and database status for monitoring', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.GET();
    const body = await responseJson(response);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body).toMatchObject({
      checks: {
        database: {
          ok: true,
        },
      },
      ok: true,
      release: {
        revision: null,
        shortRevision: null,
      },
      service: 'yourfield-next',
      version: expect.any(String),
    });
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
      }),
    );
  });

  it('exposes the deployed release revision when provided by the runtime', async () => {
    vi.stubEnv('APP_RELEASE_REVISION', '1a8ccf1c4447b9a71f224f1ae77ec60da07dfaa8');
    const { route } = await loadRoute();

    const response = await route.GET();
    const body = await responseJson(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      release: {
        revision: '1a8ccf1c4447b9a71f224f1ae77ec60da07dfaa8',
        shortRevision: '1a8ccf1',
      },
    });
  });

  it('returns 503 without leaking internals when the database ping fails', async () => {
    vi.resetModules();
    vi.doMock('@/lib/cms/payload', () => ({
      getPayloadClient: vi.fn(() => Promise.reject(new Error('connection refused'))),
    }));
    vi.doMock('@/lib/env', () => ({
      env: {
        APP_RELEASE_REVISION: undefined,
        APP_VERSION: 'test-version',
      },
    }));
    const route = await import('@/app/(site)/api/health/route');

    const response = await route.GET();
    const body = await responseJson(response);

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      checks: {
        database: {
          code: 'DATABASE_UNAVAILABLE',
          ok: false,
        },
      },
      ok: false,
    });
    expect(JSON.stringify(body)).not.toContain('connection refused');
  });
});

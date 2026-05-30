import { afterEach, describe, expect, it, vi } from 'vitest';

type CacheRegistration = Readonly<{
  keyParts: readonly string[];
  options?: Record<string, unknown>;
}>;

const mocks = vi.hoisted(() => {
  const registrations: CacheRegistration[] = [];
  const getPayloadClient = vi.fn();
  const unstableCache = vi.fn(
    (
      fn: (...args: unknown[]) => Promise<unknown>,
      keyParts: string[],
      options?: Record<string, unknown>,
    ) => {
      registrations.push({ keyParts, ...(options ? { options } : {}) });
      const values = new Map<string, Promise<unknown>>();

      return (...args: unknown[]) => {
        const key = JSON.stringify(args);
        const cached = values.get(key);

        if (cached) {
          return cached;
        }

        const nextValue = fn(...args);
        values.set(key, nextValue);

        return nextValue;
      };
    },
  );

  return {
    getPayloadClient,
    registrations,
    unstableCache,
  };
});

vi.mock('next/cache', () => ({
  unstable_cache: mocks.unstableCache,
}));

vi.mock('@/lib/cms/payload', () => ({
  getPayloadClient: mocks.getPayloadClient,
}));

afterEach(() => {
  mocks.getPayloadClient.mockReset();
  mocks.registrations.length = 0;
  mocks.unstableCache.mockClear();
  vi.resetModules();
});

describe('Payload hot search terms cache', () => {
  it('uses a 24-hour unstable_cache wrapper to avoid recalculating hot terms on every request', async () => {
    const payload = {
      find: vi.fn(async (args: { collection: string }) =>
        args.collection === 'products'
          ? { docs: [{ name: '消防员灭火防护服' }] }
          : { docs: [{ eventType: 'search', hits: 2, locale: 'zh', query: '防电弧服' }] },
      ),
    };
    mocks.getPayloadClient.mockResolvedValue(payload);

    const { getPayloadHotSearchTerms } = await import('@/lib/search/payload');

    await getPayloadHotSearchTerms('zh', ['消防员灭火防护服'], 5);
    await getPayloadHotSearchTerms('zh', ['消防员灭火防护服'], 5);

    expect(mocks.registrations).toContainEqual(
      expect.objectContaining({
        keyParts: ['payload-hot-search-terms'],
        options: expect.objectContaining({ revalidate: 86_400 }),
      }),
    );
    expect(
      payload.find.mock.calls.filter(([args]) => args.collection === 'search-logs'),
    ).toHaveLength(1);
  });

  it('uses recent published product names before static fallback terms during cold start', async () => {
    const payload = {
      find: vi.fn(async (args: { collection: string }) => {
        if (args.collection === 'products') {
          return {
            docs: [{ name: '消防员灭火防护服' }, { name: '防电弧服' }],
          };
        }

        return { docs: [] };
      }),
    };
    mocks.getPayloadClient.mockResolvedValue(payload);

    const { getPayloadHotSearchTerms } = await import('@/lib/search/payload');
    const terms = await getPayloadHotSearchTerms('zh', ['应急抢险'], 3);

    expect(terms).toEqual(['消防员灭火防护服', '防电弧服', '应急抢险']);
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        draft: false,
        limit: 3,
        locale: 'zh',
        sort: '-publishedAt',
      }),
    );
  });
});

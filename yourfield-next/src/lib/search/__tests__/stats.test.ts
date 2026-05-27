import { describe, expect, it, vi } from 'vitest';

import {
  findSearchLogDocuments,
  getHotSearchTermsFromPayload,
  getSearchStatsFromPayload,
  hotTermsFromSearchLogs,
  isSearchLogsSchemaError,
  parseSearchStatsParams,
  summarizeSearchLogs,
} from '../stats';

const logs = [
  {
    eventType: 'search',
    hits: 2,
    locale: 'zh',
    query: 'HYF',
  },
  {
    eventType: 'search',
    hits: 0,
    locale: 'zh',
    query: 'no-match',
  },
  {
    eventType: 'result-click',
    hits: 2,
    locale: 'zh',
    query: 'HYF',
    resultType: 'product',
  },
  {
    eventType: 'search',
    hits: 5,
    locale: 'en',
    query: 'protective',
  },
] as const;

describe('search log stats', () => {
  it('summarizes top keywords, zero-result terms, and CTR by locale', () => {
    const stats = summarizeSearchLogs(logs, { limit: 10, locale: 'zh' });

    expect(stats).toMatchObject({
      ctr: 0.5,
      locale: 'zh',
      totalClicks: 1,
      totalSearches: 2,
      zeroResultSearches: 1,
    });
    expect(stats.topKeywords).toEqual([
      expect.objectContaining({
        averageHits: 2,
        clicks: 1,
        ctr: 1,
        query: 'HYF',
        searches: 1,
      }),
      expect.objectContaining({
        averageHits: 0,
        clicks: 0,
        ctr: 0,
        query: 'no-match',
        searches: 1,
        zeroResultSearches: 1,
      }),
    ]);
    expect(stats.zeroResultKeywords).toEqual([
      expect.objectContaining({
        query: 'no-match',
        zeroResultSearches: 1,
      }),
    ]);
  });

  it('counts search records when optional resultType is stored as null', () => {
    const stats = summarizeSearchLogs(
      [
        {
          eventType: 'search',
          hits: 2,
          locale: 'zh',
          query: 'HYF',
          resultType: null,
        },
        {
          eventType: 'result-click',
          hits: 2,
          locale: 'zh',
          query: 'HYF',
          resultType: 'product',
        },
      ],
      { limit: 10, locale: 'zh' },
    );

    expect(stats).toMatchObject({
      ctr: 1,
      totalClicks: 1,
      totalSearches: 1,
      zeroResultSearches: 0,
    });
    expect(stats.topKeywords).toEqual([
      expect.objectContaining({
        clicks: 1,
        query: 'HYF',
        searches: 1,
      }),
    ]);
  });

  it('parses and bounds admin stats query parameters', () => {
    expect(
      parseSearchStatsParams({
        createdAfter: '2026-05-20T00:00:00.000Z',
        limit: '2',
        locale: 'en',
      }),
    ).toEqual({
      ok: true,
      value: {
        createdAfter: '2026-05-20T00:00:00.000Z',
        limit: 2,
        locale: 'en',
      },
    });
    const invalidParams = parseSearchStatsParams({ limit: '101', locale: 'de' });

    expect(invalidParams.ok).toBe(false);
    if ('error' in invalidParams) {
      expect(invalidParams.error.fields.limit?.length).toBeGreaterThan(0);
      expect(invalidParams.error.fields.locale?.length).toBeGreaterThan(0);
    }
  });

  it('parses admin stats time windows into a createdAt cutoff', () => {
    const parsed = parseSearchStatsParams({ limit: '10', locale: '', window: '7d' });

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.locale).toBeUndefined();
      expect(parsed.value.window).toBe('7d');
      expect(typeof parsed.value.createdAfter).toBe('string');

      const cutoff = Date.parse(String(parsed.value.createdAfter));
      expect(Number.isFinite(cutoff)).toBe(true);
      expect(cutoff).toBeGreaterThan(Date.now() - 8 * 24 * 60 * 60 * 1000);
      expect(cutoff).toBeLessThanOrEqual(Date.now());
    }
  });

  it('loads stats from the requested createdAt window', async () => {
    const createdAfter = '2026-05-20T00:00:00.000Z';
    const payload = {
      find: vi.fn((_args: unknown) =>
        Promise.resolve({
          docs: [
            {
              createdAt: '2026-05-19T23:59:59.000Z',
              eventType: 'search',
              hits: 0,
              locale: 'zh',
              query: '过期关键词',
            },
            {
              createdAt: '2026-05-21T00:00:00.000Z',
              eventType: 'search',
              hits: 2,
              locale: 'zh',
              query: '有效关键词',
            },
          ],
        }),
      ),
    };

    const stats = await getSearchStatsFromPayload(payload, {
      createdAfter,
      limit: 5,
      locale: 'zh',
    });

    const firstFindCall = payload.find.mock.calls[0]?.[0] as {
      collection?: string;
      where?: {
        createdAt?: { greater_than_equal?: string };
        locale?: { equals?: string };
      };
    };

    expect(firstFindCall.collection).toBe('search-logs');
    expect(firstFindCall.where?.createdAt?.greater_than_equal).toBe(createdAfter);
    expect(firstFindCall.where?.locale?.equals).toBe('zh');
    expect(stats).toMatchObject({
      createdAfter,
      totalSearches: 1,
      zeroResultSearches: 0,
    });
    expect(stats.topKeywords.map((item) => item.query)).toEqual(['有效关键词']);
  });

  it('uses search logs before static fallback terms for non-Chinese hot searches', () => {
    expect(
      hotTermsFromSearchLogs(logs, {
        fallbackTerms: ['arc flash'],
        limit: 3,
        locale: 'en',
      }),
    ).toEqual(['protective', 'arc flash']);
  });

  it('uses Chinese business terms for zh hot searches', () => {
    expect(
      hotTermsFromSearchLogs(
        [
          ...logs,
          {
            eventType: 'search',
            hits: 6,
            locale: 'zh',
            query: '消防员灭火防护服',
          },
          {
            eventType: 'search',
            hits: 5,
            locale: 'zh',
            query: '消防员灭火防护服',
          },
          {
            eventType: 'search',
            hits: 4,
            locale: 'zh',
            query: '防电弧服',
          },
        ],
        {
          fallbackTerms: ['HYF-5506', 'XF10-2014', '应急抢险'],
          limit: 4,
          locale: 'zh',
        },
      ),
    ).toEqual(['消防员灭火防护服', '防电弧服', '应急抢险']);
  });

  it('loads hot-search logs from the current 7-day dashboard window', async () => {
    const payload = {
      find: vi.fn(
        (_args: {
          limit?: number;
          where?: {
            createdAt?: {
              greater_than_equal?: string;
            };
          };
        }) => Promise.resolve({ docs: [] }),
      ),
    };

    await getHotSearchTermsFromPayload(payload, {
      fallbackTerms: ['消防员灭火防护服'],
      limit: 5,
      locale: 'zh',
    });

    const findArgs = payload.find.mock.calls[0]?.[0];
    expect(findArgs).toMatchObject({
      collection: 'search-logs',
      depth: 0,
      overrideAccess: true,
      sort: '-createdAt',
      where: {
        locale: {
          equals: 'zh',
        },
      },
    });
    expect(typeof findArgs?.limit).toBe('number');
    expect(typeof findArgs?.where?.createdAt?.greater_than_equal).toBe('string');
    const cutoff = Date.parse(String(findArgs?.where?.createdAt?.greater_than_equal));
    expect(Number.isFinite(cutoff)).toBe(true);
    expect(cutoff).toBeGreaterThan(Date.now() - 8 * 24 * 60 * 60 * 1000);
    expect(cutoff).toBeLessThanOrEqual(Date.now());
  });

  it('returns an empty local stats set when the search_logs table is missing', async () => {
    const payload = {
      find: vi.fn(() => Promise.reject(new Error('relation "search_logs" does not exist'))),
    };

    await expect(findSearchLogDocuments(payload, { locale: 'zh' })).resolves.toEqual([]);
    await expect(
      getHotSearchTermsFromPayload(payload, {
        fallbackTerms: ['消防员灭火防护服'],
        limit: 5,
        locale: 'zh',
      }),
    ).resolves.toEqual(['消防员灭火防护服']);
    await expect(getSearchStatsFromPayload(payload, { limit: 5, locale: 'zh' })).resolves.toEqual(
      expect.objectContaining({
        topKeywords: [],
        totalClicks: 0,
        totalSearches: 0,
        zeroResultKeywords: [],
      }),
    );
    expect(isSearchLogsSchemaError(new Error('table "search_logs" does not exist'))).toBe(true);
  });
});

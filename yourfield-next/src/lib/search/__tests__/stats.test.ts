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

  it('parses and bounds admin stats query parameters', () => {
    expect(parseSearchStatsParams({ limit: '2', locale: 'en' })).toEqual({
      ok: true,
      value: {
        limit: 2,
        locale: 'en',
      },
    });
    const invalidParams = parseSearchStatsParams({ limit: '101', locale: 'de' });

    expect(invalidParams.ok).toBe(false);
    if (!invalidParams.ok) {
      expect(invalidParams.error.fields.limit?.length).toBeGreaterThan(0);
      expect(invalidParams.error.fields.locale?.length).toBeGreaterThan(0);
    }
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

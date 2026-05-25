import { describe, expect, it } from 'vitest';

import { renderSearchStatsHtml } from '@/collections/SearchLogs';

describe('renderSearchStatsHtml', () => {
  it('renders the stats view in Chinese with a zh-CN document language', () => {
    const html = renderSearchStatsHtml({
      ctr: 0.375,
      generatedAt: '2026-05-18T00:00:00.000Z',
      locale: 'zh',
      topKeywords: [
        {
          averageHits: 2,
          clicks: 3,
          ctr: 0.375,
          locale: 'zh',
          query: '消防员灭火防护服',
          searches: 8,
          zeroResultSearches: 1,
        },
      ],
      totalClicks: 3,
      totalSearches: 8,
      zeroResultKeywords: [
        {
          averageHits: 0,
          clicks: 0,
          ctr: 0,
          locale: 'zh',
          query: '不存在的型号',
          searches: 2,
          zeroResultSearches: 2,
        },
      ],
      zeroResultSearches: 2,
    });

    expect(html).toContain('<html lang="zh-CN">');
    expect(html).toContain('<title>站内搜索统计</title>');
    expect(html).toContain('搜索总次数');
    expect(html).toContain('零结果次数');
    expect(html).toContain('点击总次数');
    expect(html).toContain('点击率');
    expect(html).toContain('热门关键词 Top 100');
    expect(html).toContain('零结果关键词');
    expect(html).toContain('关键词');
    expect(html).toContain('语言');
    expect(html).toContain('搜索次数');
    expect(html).toContain('零结果');
    expect(html).toContain('点击次数');
    expect(html).toContain('数据生成时间');
    expect(html).toContain('中文');
    expect(html).not.toContain('Search analytics');
    expect(html).not.toContain('Total searches');
    expect(html).not.toContain('Zero-result searches');
    expect(html).not.toContain('Generated at');
    expect(html).not.toContain('No data yet.');
  });

  it('uses Chinese empty-state copy when there is no stats data yet', () => {
    const html = renderSearchStatsHtml({
      ctr: 0,
      generatedAt: '2026-05-18T00:00:00.000Z',
      topKeywords: [],
      totalClicks: 0,
      totalSearches: 0,
      zeroResultKeywords: [],
      zeroResultSearches: 0,
    });

    expect(html).toContain('暂无数据');
  });
});

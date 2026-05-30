import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { renderSearchStatsHtml, SearchLogs, SearchLogsStatsPanel } from '@/collections/SearchLogs';

describe('SearchLogs admin stats display', () => {
  it('mounts a SearchLogs stats panel before the admin list', () => {
    expect(SearchLogs.admin?.components?.beforeList).toContain(
      '@/components/admin/search-logs/SearchLogsStatsPanel#SearchLogsStatsPanel',
    );
  });

  it('renders the local analytics panel shell for Payload admin', () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        SearchLogsStatsPanel,
        {} as React.ComponentProps<typeof SearchLogsStatsPanel>,
      ),
    );

    expect(markup).toContain('站内搜索统计');
    expect(markup).toContain('热门关键词 Top 100');
    expect(markup).toContain('零结果关键词');
    expect(markup).toContain('点击率');
    expect(markup).toContain('时间范围');
    expect(markup).toContain('近 7 天');
    expect(markup).toContain('应用 / 刷新数据');
    expect(markup).toContain('打开 JSON 原始数据');
    expect(markup).toContain('target="search-logs-stats-frame"');
    expect(markup).not.toContain('Search analytics');
  });

  it('renders escaped Top 100 and zero-result stats in the admin HTML view', () => {
    const html = renderSearchStatsHtml({
      ctr: 0.5,
      generatedAt: '2026-05-18T00:00:00.000Z',
      topKeywords: [
        {
          averageHits: 1,
          clicks: 1,
          ctr: 0.5,
          locale: 'zh',
          query: '<HYF>',
          searches: 2,
          zeroResultSearches: 0,
        },
      ],
      totalClicks: 1,
      totalSearches: 2,
      zeroResultKeywords: [
        {
          averageHits: 0,
          clicks: 0,
          ctr: 0,
          locale: 'zh',
          query: 'none',
          searches: 1,
          zeroResultSearches: 1,
        },
      ],
      zeroResultSearches: 1,
    });

    expect(html).toContain('<html lang="zh-CN">');
    expect(html).toContain('站内搜索统计');
    expect(html).toContain('热门关键词 Top 100');
    expect(html).toContain('零结果关键词');
    expect(html).toContain('搜索总次数');
    expect(html).toContain('零结果次数');
    expect(html).toContain('点击总次数');
    expect(html).toContain('点击率');
    expect(html).toContain('50.0%');
    expect(html).toContain('&lt;HYF&gt;');
    expect(html).not.toContain('<HYF>');
  });

  it('uses Chinese labels and descriptions in the Payload list fields', () => {
    const eventTypeField = SearchLogs.fields.find(
      (field) => 'name' in field && field.name === 'eventType',
    );
    const localeField = SearchLogs.fields.find(
      (field) => 'name' in field && field.name === 'locale',
    );

    expect(SearchLogs.admin?.defaultColumns).toEqual([
      'query',
      'locale',
      'eventType',
      'hits',
      'resultType',
      'createdAt',
    ]);
    expect(eventTypeField).toMatchObject({
      admin: { description: '区分一次搜索还是搜索结果点击。' },
      label: '事件类型',
    });
    expect(localeField).toMatchObject({
      admin: { description: '记录用户使用的前台语言版本。' },
      label: '语言',
    });
  });
});

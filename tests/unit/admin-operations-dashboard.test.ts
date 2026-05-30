// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@payloadcms/ui', () => ({
  useAuth: () => ({
    user: {
      email: 'ops@example.com',
      name: '运营同事',
    },
  }),
  useTranslation: () => ({ i18n: { language: 'zh' } }),
}));

import {
  AdminOperationsDashboard,
  dashboardRangeOptions,
  deriveSearchStats,
  displayableOperationalTopKeywords,
  isDisplayableOperationalSearchTerm,
} from '@/components/admin/AdminOperationsDashboard';
import { TrendChart } from '@/components/admin/dashboard/sections/TrendChart';
import { buildDashboardHealthResponse } from '@/components/admin/dashboard/health';
import type { DashboardChartPoint } from '@/components/admin/dashboard/types';

function requestUrl(path: RequestInfo | URL) {
  if (typeof path === 'string') {
    return path;
  }

  if (path instanceof URL) {
    return path.toString();
  }

  return path.url;
}

function dashboardApiResponse(path: string) {
  if (path.includes('/dashboard/health')) {
    return {
      computedAt: new Date().toISOString(),
      items: [
        {
          actionHref: '/admin-kpi/collections/products',
          actionLabel: '去补图',
          count: 1,
          label: '已发布产品缺主图',
          ruleId: 'R1',
          severity: 'severe',
        },
        {
          actionHref: '/admin-kpi/collections/news',
          actionLabel: '去更新',
          count: 0,
          label: '最近 30 天无新闻更新',
          ruleId: 'R5',
          severity: 'info',
        },
      ],
      level: 'warning',
      score: 88,
    };
  }

  if (path.includes('/search-logs?')) {
    return {
      docs: [
        { createdAt: new Date().toISOString(), eventType: 'search', hits: 3, query: 'HYF-5506' },
        {
          createdAt: new Date().toISOString(),
          eventType: 'search',
          hits: 0,
          query: '????????????',
        },
        {
          createdAt: new Date().toISOString(),
          eventType: 'search',
          hits: 0,
          query: '消防员灭火防护服',
        },
        { createdAt: new Date().toISOString(), eventType: 'result-click', query: 'HYF-5506' },
      ],
      totalDocs: 3,
    };
  }

  if (path.includes('/form-submissions?')) {
    return path.includes('where%5Bstatus%5D%5Bequals%5D=new')
      ? {
          docs: [{ company: '永霏', name: '王经理', status: 'new' }],
          totalDocs: 1,
        }
      : {
          docs: [{ company: '永霏', name: '王经理', status: 'new' }],
          totalDocs: 3,
        };
  }

  if (path.includes('/products?')) {
    return { docs: [{}], totalDocs: 12 };
  }

  if (path.includes('/product-groups?')) {
    return { docs: [{}], totalDocs: 4 };
  }

  return { docs: [], totalDocs: 0 };
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

const trendChartPoints: DashboardChartPoint[] = [
  { clicks: 2, dateKey: '2026-05-21', forms: 0, label: '5/21', searches: 9, total: 11 },
  { clicks: 3, dateKey: '2026-05-22', forms: 1, label: '5/22', searches: 12, total: 16 },
  { clicks: 4, dateKey: '2026-05-23', forms: 2, label: '5/23', searches: 14, total: 20 },
];

function renderTrendChart() {
  const onSelectDate = vi.fn();

  render(
    createElement(TrendChart, {
      chartPoints: trendChartPoints,
      onSelectDate,
      rangeLabel: '近7天',
      selectedPoint: trendChartPoints[trendChartPoints.length - 1],
    }),
  );

  return { onSelectDate };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AdminOperationsDashboard helpers', () => {
  it('offers clear date ranges for the operations dashboard', () => {
    expect(dashboardRangeOptions).toEqual([
      { label: '近7天', value: 7 },
      { label: '近30天', value: 30 },
      { label: '近90天', value: 90 },
    ]);
  });

  it('derives search metrics from the loaded search logs', () => {
    const stats = deriveSearchStats({
      docs: [
        { eventType: 'search', hits: 3, query: '焊接服' },
        { eventType: 'search', hits: 0, query: '焊接服' },
        { eventType: 'result-click', query: '焊接服' },
        { eventType: 'search', hits: 2, query: '防护服' },
      ],
      totalDocs: 4,
    });

    expect(stats.totalSearches).toBe(3);
    expect(stats.totalClicks).toBe(1);
    expect(stats.zeroResultSearches).toBe(1);
    expect(stats.ctr).toBeCloseTo(1 / 3);
    expect(stats.topKeywords?.[0]).toMatchObject({
      clicks: 1,
      query: '焊接服',
      searches: 2,
      zeroResultSearches: 1,
    });
  });

  it('keeps raw search totals and displays real operational keywords', () => {
    const stats = deriveSearchStats({
      docs: [
        { eventType: 'search', hits: 1, query: 'HYF-5506' },
        { eventType: 'search', hits: 1, query: 'HYF-5506' },
        { eventType: 'search', hits: 2, query: 'XF10-2014' },
        { eventType: 'search', hits: 2, query: 'XF10-2014' },
        { eventType: 'search', hits: 0, query: 'zzzz-r4-no-result' },
        { eventType: 'search', hits: 5, query: '消防员灭火防护服' },
      ],
      totalDocs: 6,
    });

    expect(stats.totalSearches).toBe(6);
    expect(displayableOperationalTopKeywords(stats.topKeywords).map((item) => item.query)).toEqual([
      'HYF-5506',
      'XF10-2014',
      '消防员灭火防护服',
    ]);
  });

  it('keeps model and standard searches but rejects obvious test noise', () => {
    expect(isDisplayableOperationalSearchTerm('消防员灭火防护服')).toBe(true);
    expect(isDisplayableOperationalSearchTerm('防电弧服')).toBe(true);
    expect(isDisplayableOperationalSearchTerm('HYF-5506')).toBe(true);
    expect(isDisplayableOperationalSearchTerm('XF10-2014')).toBe(true);
    expect(isDisplayableOperationalSearchTerm('zzzz-not-found-search')).toBe(false);
    expect(isDisplayableOperationalSearchTerm('test keyword')).toBe(false);
    expect(isDisplayableOperationalSearchTerm('????????????')).toBe(false);
  });

  it('scores dashboard health from content and inquiry gaps', () => {
    const health = buildDashboardHealthResponse({
      adminBase: '/admin',
      news: [],
      now: new Date('2026-05-24T00:00:00.000Z'),
      overdueSubmissions: [{ id: 1 }, { id: 2 }],
      productGroups: [
        { id: 'group-1', showOnFrontend: true },
        { id: 'group-2', showOnFrontend: true },
        { id: 'group-3', showOnFrontend: false },
      ],
      products: [
        {
          _status: 'published',
          id: 1,
          images: [],
          name: { en: '', ru: '俄文产品', zh: '中文产品' },
          productGroup: 'group-1',
        },
        {
          _status: 'published',
          id: 2,
          images: [{ file: 10 }],
          name: { en: 'Product', ru: 'Продукт', zh: '产品' },
          productGroup: 'group-1',
        },
        {
          _status: 'draft',
          id: 3,
          images: [],
          name: { en: '', ru: '', zh: '草稿' },
          productGroup: 'group-2',
        },
      ],
    });

    expect(health.score).toBe(73);
    expect(health.level).toBe('warning');
    expect(health.items.some((item) => item.label.includes('SEO'))).toBe(false);
    expect(Object.fromEntries(health.items.map((item) => [item.ruleId, item.count]))).toEqual({
      R1: 1,
      R2: 1,
      R3: 1,
      R5: 1,
      R6: 2,
    });
  });
});

describe('AdminOperationsDashboard loading behavior', () => {
  it('keeps trend chart controls and tooltip layout bounded', () => {
    renderTrendChart();

    const clicksChip = screen.getByRole('button', { name: '点击' });
    fireEvent.click(clicksChip);

    expect(clicksChip.classList.contains('is-hidden')).toBe(true);

    const tooltip = screen.getByRole('status');
    expect(tooltip.getAttribute('style')).toContain('clamp(');
  });

  it('maps the trend chart viewBox to the rendered SVG size', () => {
    const resizeCallbacks: ResizeObserverCallback[] = [];
    const observe = vi.fn();
    const disconnect = vi.fn();

    vi.stubGlobal(
      'ResizeObserver',
      vi.fn((callback: ResizeObserverCallback) => {
        resizeCallbacks.push(callback);
        return { disconnect, observe, unobserve: vi.fn() };
      }),
    );

    renderTrendChart();

    const chart = screen.getByRole('img', { name: '近7天互动趋势折线图' });

    act(() => {
      resizeCallbacks[0]?.(
        [
          {
            contentRect: { height: 252, width: 640 },
          } as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      );
    });

    expect(observe).toHaveBeenCalledTimes(1);
    expect(observe.mock.calls[0]?.[0]).toBe(chart);
    expect(chart.getAttribute('viewBox')).toBe('0 0 640 252');
  });

  it('renders a focused operator dashboard and the interactive SVG trend chart', async () => {
    const fetchMock = vi.fn((path: RequestInfo | URL) =>
      jsonResponse(dashboardApiResponse(requestUrl(path))),
    );

    vi.stubGlobal('fetch', fetchMock);

    render(
      createElement(AdminOperationsDashboard, {
        adminBase: '/admin-kpi',
        apiBase: '/api-kpi',
      }),
    );

    await waitFor(() => {
      expect(screen.getByText('内容健康度')).toBeTruthy();
    });

    const metrics = screen.getByLabelText('网站运营关键指标');
    expect(metrics.querySelectorAll('.yourfield-ops-metric')).toHaveLength(4);
    expect(screen.getByText('今天优先处理 1 条新咨询')).toBeTruthy();
    expect(screen.getAllByText(/33\.3%/).length).toBeGreaterThan(0);
    expect(screen.getByText('点击率')).toBeTruthy();
    expect(screen.getByText('2 次零结果搜索')).toBeTruthy();
    const searchMetricHref = screen.getByText('站内搜索').closest('a')?.getAttribute('href') ?? '';
    const ctrMetricHref = screen.getByText('点击率').closest('a')?.getAttribute('href') ?? '';
    expect(searchMetricHref).toContain('/api-kpi/search-logs/stats-view?');
    expect(searchMetricHref).toContain('createdAfter=');
    expect(searchMetricHref).not.toContain('/collections/search-logs');
    expect(ctrMetricHref).toContain('/api-kpi/search-logs/stats-view?');
    expect(ctrMetricHref).toContain('createdAfter=');
    expect(ctrMetricHref).not.toContain('/collections/search-logs');
    expect(screen.getByText('1 项已发布产品缺主图')).toBeTruthy();
    expect(screen.getByText('最近用户在站内搜索过的关键词。')).toBeTruthy();
    expect(screen.getByText('客户提交的留言与询盘,按提交时间倒序。')).toBeTruthy();
    expect(screen.queryByText(/测试噪音/)).toBeNull();

    const chart = screen.getByRole('img', { name: '近7天互动趋势折线图' });
    expect(chart.tagName.toLowerCase()).toBe('svg');
    expect(chart.querySelector('path')).toBeTruthy();
    expect(screen.getByRole('button', { name: '搜索' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '点击' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '询盘' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('debounces focus refetches until the previous successful load is older than 60 seconds', async () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const fetchMock = vi.fn((path: RequestInfo | URL) =>
      jsonResponse(dashboardApiResponse(requestUrl(path))),
    );

    vi.stubGlobal('fetch', fetchMock);

    render(
      createElement(AdminOperationsDashboard, {
        adminBase: '/admin-focus',
        apiBase: '/api-focus',
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '刷新数据' })).toBeTruthy();
    });

    expect(fetchMock).toHaveBeenCalledTimes(12);

    window.dispatchEvent(new Event('focus'));
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(12);

    nowSpy.mockReturnValue(61_001);
    window.dispatchEvent(new Event('focus'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(24);
    });
  });

  it('keeps the cached dashboard visible while reloading after admin navigation remounts it', async () => {
    let pauseFetches = false;
    const fetchMock = vi.fn((path: RequestInfo | URL) => {
      if (pauseFetches) {
        return new Promise<Response>(() => undefined);
      }

      return jsonResponse(dashboardApiResponse(requestUrl(path)));
    });

    vi.stubGlobal('fetch', fetchMock);

    const props = {
      adminBase: '/admin-cache-remount',
      apiBase: '/api-cache-remount',
    };
    const firstRender = render(createElement(AdminOperationsDashboard, props));

    expect(screen.getByText('加载中')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '刷新数据' })).toBeTruthy();
    });

    firstRender.unmount();
    pauseFetches = true;

    render(createElement(AdminOperationsDashboard, props));

    expect(screen.queryByText('加载中')).toBeNull();
    expect(screen.getByText('站内搜索')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '更新中' })).toBeTruthy();
    });
  });
});

import type { Props as ListProps } from 'payload/dist/admin/components/views/collections/List/types';
import type { CollectionConfig } from 'payload/types';
import type { CSSProperties, ReactElement } from 'react';

import { canRead, deny, hasPayloadAccess } from '../lib/payload/access';
import { localeOptions } from '../lib/payload/fields/options';
import {
  getSearchStatsFromPayload,
  parseSearchStatsParams,
  type SearchKeywordStats,
  type SearchStats,
  type SearchStatsWindow,
} from '../lib/search/stats';
import { searchHitTypes, type SearchLocale } from '../lib/search/types';

const searchLogEventOptions = [
  { label: '搜索', value: 'search' },
  { label: '结果点击', value: 'result-click' },
] satisfies Array<{ label: string; value: string }>;

const searchResultTypeOptions = searchHitTypes.map((value) => ({
  label: value,
  value,
}));

type PayloadAccessRequest = Parameters<typeof hasPayloadAccess>[0];

type SearchStatsEndpointRequest = PayloadAccessRequest &
  Readonly<{
    payload: Parameters<typeof getSearchStatsFromPayload>[0];
    query: unknown;
    user?: unknown;
  }>;

type SearchStatsEndpointResponse = Readonly<{
  status: (status: number) => {
    json: (body: unknown) => void;
    send: (body: string) => void;
  };
}>;

type SearchStatsLocaleFilter = SearchLocale | 'all';
type SearchStatsTimeFilter = SearchStatsWindow | 'all';

const searchStatsEndpointPath = '/payload-api/search-logs/stats';
const searchStatsViewPath = '/payload-api/search-logs/stats-view';
const searchStatsLocaleFilters: Array<{ label: string; value: SearchStatsLocaleFilter }> = [
  { label: '全部语言', value: 'all' },
  { label: '中文', value: 'zh' },
  { label: '英文', value: 'en' },
  { label: '俄文', value: 'ru' },
];
const searchStatsTimeFilters: Array<{ label: string; value: SearchStatsTimeFilter }> = [
  { label: '全部时间', value: 'all' },
  { label: '近 7 天', value: '7d' },
  { label: '近 30 天', value: '30d' },
  { label: '近 90 天', value: '90d' },
];

const localeDisplayLabels: Record<string, string> = {
  en: '英文',
  ru: '俄文',
  zh: '中文',
};
const timeDisplayLabels: Record<SearchStatsWindow, string> = {
  '7d': '近 7 天',
  '30d': '近 30 天',
  '90d': '近 90 天',
};

const panelStyles = {
  wrapper: {
    background: '#fff',
    border: '1px solid rgba(24, 56, 92, 0.14)',
    borderRadius: 10,
    boxShadow: '0 18px 48px rgba(15, 38, 64, 0.06)',
    marginBottom: 24,
    padding: 22,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    color: '#17314f',
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.25,
    margin: 0,
  },
  description: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 1.6,
    margin: '6px 0 0',
    maxWidth: 720,
  },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    margin: '14px 0',
  },
  filterButton: {
    background: '#176da6',
    border: '1px solid rgba(23, 109, 166, 0.26)',
    borderRadius: 8,
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 900,
    minHeight: 38,
    padding: '8px 14px',
  },
  filterField: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
  },
  filterLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 900,
  },
  filterLink: {
    background: '#f7fbff',
    border: '1px solid rgba(23, 109, 166, 0.22)',
    borderRadius: 999,
    color: '#17314f',
    fontSize: 12,
    fontWeight: 800,
    padding: '7px 14px',
    textDecoration: 'none',
    transition: 'background 160ms ease, border-color 160ms ease, color 160ms ease',
  },
  filterSelect: {
    background: '#f7fbff',
    border: '1px solid rgba(23, 109, 166, 0.22)',
    borderRadius: 8,
    color: '#17314f',
    fontSize: 12,
    fontWeight: 800,
    minHeight: 38,
    padding: '8px 10px',
  },
  frame: {
    background: '#ffffff',
    border: '1px solid rgba(24, 56, 92, 0.12)',
    borderRadius: 10,
    display: 'block',
    height: 580,
    width: '100%',
  },
} satisfies Record<string, CSSProperties>;

const reactElementSymbol = Symbol.for('react.element');

function searchStatsPath(
  path: string,
  locale: SearchStatsLocaleFilter,
  window: SearchStatsTimeFilter = 'all',
) {
  const params = new URLSearchParams({ limit: '100' });

  if (locale !== 'all') {
    params.set('locale', locale);
  }

  if (window !== 'all') {
    params.set('window', window);
  }

  return `${path}?${params.toString()}`;
}

function h(
  type: string,
  props: (Record<string, unknown> & { key?: string }) | null,
  ...children: unknown[]
): ReactElement {
  const { key, ...rest } = props ?? {};

  return {
    $$typeof: reactElementSymbol,
    _owner: null,
    key: key ?? null,
    props: {
      ...rest,
      ...(children.length > 0 ? { children: children.length === 1 ? children[0] : children } : {}),
    },
    ref: null,
    type,
  } as ReactElement;
}

function formatPercent(value: number, canCalculate = true) {
  return canCalculate ? `${(value * 100).toFixed(1)}%` : '暂无';
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtmlKeywordRows(keywords: readonly SearchKeywordStats[]) {
  if (keywords.length === 0) {
    return '<tr><td colspan="6" class="empty">暂无数据</td></tr>';
  }

  return keywords
    .slice(0, 100)
    .map(
      (item) => `<tr>
        <td class="cell-keyword">${escapeHtml(item.query)}</td>
        <td class="cell-locale"><span class="locale-chip">${escapeHtml(localeDisplayLabels[item.locale] ?? item.locale)}</span></td>
        <td class="cell-number">${item.searches}</td>
        <td class="cell-number ${item.zeroResultSearches > 0 ? 'cell-number--warn' : ''}">${item.zeroResultSearches}</td>
        <td class="cell-number">${item.clicks}</td>
        <td class="cell-number">${formatPercent(item.ctr, item.searches > 0)}</td>
      </tr>`,
    )
    .join('');
}

function renderHtmlKeywordsTable(
  title: string,
  keywords: readonly SearchKeywordStats[],
  sectionId?: string,
) {
  return `<section${sectionId ? ` id="${escapeHtml(sectionId)}"` : ''} class="table-card">
    <h2>${escapeHtml(title)}</h2>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>关键词</th>
            <th>语言</th>
            <th>搜索次数</th>
            <th>零结果</th>
            <th>点击次数</th>
            <th>点击率</th>
          </tr>
        </thead>
        <tbody>${renderHtmlKeywordRows(keywords)}</tbody>
      </table>
    </div>
  </section>`;
}

export function renderSearchStatsHtml(stats: SearchStats) {
  const localeLabel = stats.locale ? (localeDisplayLabels[stats.locale] ?? stats.locale) : '';
  const timeLabel = stats.window ? timeDisplayLabels[stats.window] : '';
  const createdAfterLabel = stats.createdAfter
    ? ` · 起始时间 <strong>${escapeHtml(stats.createdAfter)}</strong>`
    : '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>站内搜索统计</title>
  <style>
    :root {
      color-scheme: light;
      --primary: #176da6;
      --primary-dark: #17314f;
      --accent: #ef3b49;
      --warn: #c77a12;
      --muted: #64748b;
      --line: rgba(24, 56, 92, 0.12);
      --surface: #ffffff;
      --surface-soft: #f7fbff;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      background: var(--surface-soft);
      color: var(--primary-dark);
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei",
        "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.5;
    }
    main {
      padding: 20px;
      display: grid;
      gap: 20px;
    }
    .page-head {
      display: grid;
      gap: 6px;
    }
    .page-head h1 {
      color: var(--primary-dark);
      font-size: 22px;
      line-height: 1.2;
      margin: 0;
    }
    .page-head p {
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
      margin: 0;
    }
    .summary {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      box-shadow: 0 12px 36px rgba(15, 38, 64, 0.05);
      padding: 16px 18px;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      inset: 0 0 auto;
      height: 3px;
      background: var(--primary);
    }
    .card--accent::before { background: var(--accent); }
    .card--warn::before { background: var(--warn); }
    .card--success::before { background: #2a8a52; }
    .label {
      color: var(--muted);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0;
      margin: 0;
    }
    .value {
      color: var(--primary-dark);
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0;
      line-height: 1.1;
      margin: 8px 0 0;
    }
    .generated {
      align-items: center;
      color: var(--muted);
      display: inline-flex;
      flex-wrap: wrap;
      font-size: 12px;
      font-weight: 700;
      gap: 6px;
      margin: 0;
    }
    .generated strong { color: var(--primary-dark); font-weight: 800; }
    .tables {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    }
    .table-card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      box-shadow: 0 12px 36px rgba(15, 38, 64, 0.05);
      overflow: hidden;
    }
    .table-card h2 {
      align-items: center;
      background: linear-gradient(90deg, rgba(23, 109, 166, 0.06), rgba(239, 59, 73, 0.04));
      border-bottom: 1px solid var(--line);
      color: var(--primary-dark);
      display: flex;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0;
      margin: 0;
      padding: 12px 16px;
    }
    .table-scroll { max-height: 400px; overflow: auto; }
    table { border-collapse: collapse; min-width: 560px; width: 100%; }
    th, td {
      border-bottom: 1px solid rgba(24, 56, 92, 0.08);
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    thead th {
      background: #fbfdff;
      color: var(--muted);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.04em;
      position: sticky;
      text-transform: uppercase;
      top: 0;
      white-space: nowrap;
      z-index: 1;
    }
    tbody tr:hover { background: rgba(23, 109, 166, 0.04); }
    .cell-keyword { color: var(--primary-dark); font-weight: 700; }
    .cell-locale { white-space: nowrap; }
    .cell-number { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .cell-number--warn { color: var(--warn); font-weight: 800; }
    .locale-chip {
      background: rgba(23, 109, 166, 0.1);
      border-radius: 999px;
      color: var(--primary);
      display: inline-flex;
      font-size: 11px;
      font-weight: 800;
      padding: 2px 9px;
    }
    .empty {
      color: var(--muted);
      font-style: italic;
      padding: 28px 16px;
      text-align: center;
    }
    @media (max-width: 640px) {
      main { padding: 16px; gap: 14px; }
      .value { font-size: 22px; }
      .table-card h2 { font-size: 13px; padding: 10px 14px; }
    }
  </style>
</head>
<body>
  <main>
    <header class="page-head">
      <h1>站内搜索统计</h1>
      <p>按语言与时间范围即时生成站内搜索、零结果关键词与点击率。</p>
    </header>
    <section class="summary" aria-label="搜索统计概览">
      <div class="card"><p class="label">搜索总次数</p><p class="value">${stats.totalSearches}</p></div>
      <div class="card card--warn"><p class="label">零结果次数</p><p class="value">${stats.zeroResultSearches}</p></div>
      <div class="card card--success"><p class="label">点击总次数</p><p class="value">${stats.totalClicks}</p></div>
      <div class="card card--accent"><p class="label">点击率</p><p class="value">${formatPercent(stats.ctr, stats.totalSearches > 0)}</p></div>
    </section>
    <p class="generated">数据生成时间 <strong>${escapeHtml(stats.generatedAt)}</strong>${
      localeLabel ? ` · 语言 <strong>${escapeHtml(localeLabel)}</strong>` : ''
    }${timeLabel ? ` · 时间范围 <strong>${escapeHtml(timeLabel)}</strong>` : ''}${createdAfterLabel}</p>
    <section class="tables">
      ${renderHtmlKeywordsTable('热门关键词 Top 100', stats.topKeywords, 'top-keywords')}
      ${renderHtmlKeywordsTable('零结果关键词', stats.zeroResultKeywords, 'zero-result-keywords')}
    </section>
  </main>
</body>
</html>`;
}

export function SearchLogsStatsPanel(_props: ListProps) {
  return h(
    'section',
    { style: panelStyles.wrapper },
    h(
      'div',
      { style: panelStyles.header },
      h(
        'div',
        null,
        h('h2', { style: panelStyles.title }, '站内搜索统计'),
        h(
          'p',
          { style: panelStyles.description },
          '基于本地 Payload 搜索日志即时生成热门关键词 Top 100、零结果关键词与点击率,可按语言和时间范围筛选,无需外部分析服务。',
        ),
      ),
    ),
    h(
      'form',
      {
        action: searchStatsViewPath,
        method: 'get',
        style: panelStyles.filters,
        target: 'search-logs-stats-frame',
      },
      h('input', { name: 'limit', type: 'hidden', value: '100' }),
      h(
        'label',
        { style: panelStyles.filterField },
        h('span', { style: panelStyles.filterLabel }, '语言'),
        h(
          'select',
          { name: 'locale', style: panelStyles.filterSelect },
          searchStatsLocaleFilters.map((option) =>
            h(
              'option',
              {
                key: option.value,
                value: option.value === 'all' ? '' : option.value,
              },
              option.label,
            ),
          ),
        ),
      ),
      h(
        'label',
        { style: panelStyles.filterField },
        h('span', { style: panelStyles.filterLabel }, '时间范围'),
        h(
          'select',
          { name: 'window', style: panelStyles.filterSelect },
          searchStatsTimeFilters.map((option) =>
            h(
              'option',
              {
                key: option.value,
                value: option.value === 'all' ? '' : option.value,
              },
              option.label,
            ),
          ),
        ),
      ),
      h('button', { style: panelStyles.filterButton, type: 'submit' }, '应用 / 刷新数据'),
    ),
    h('iframe', {
      name: 'search-logs-stats-frame',
      src: searchStatsPath(searchStatsViewPath, 'all'),
      style: panelStyles.frame,
      title: '站内搜索统计',
    }),
    h(
      'p',
      { style: panelStyles.description },
      h('a', { href: searchStatsPath(searchStatsEndpointPath, 'all') }, '打开 JSON 原始数据'),
    ),
  );
}

function sendPayloadApiError(
  res: SearchStatsEndpointResponse,
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  res.status(status).json({
    ok: false,
    error: details ? { code, details, message } : { code, message },
  });
}

async function handleSearchStatsEndpoint(
  req: SearchStatsEndpointRequest,
  res: SearchStatsEndpointResponse,
) {
  if (!(await hasPayloadAccess(req, 'read', 'search-logs'))) {
    sendPayloadApiError(res, 403, 'FORBIDDEN', '需要管理员权限。');
    return;
  }

  const parsed = parseSearchStatsParams(req.query);
  if (!parsed.ok) {
    sendPayloadApiError(res, 400, 'VALIDATION_ERROR', '搜索统计参数无效。', {
      fields: parsed.error.fields,
    });
    return;
  }

  try {
    const stats = await getSearchStatsFromPayload(req.payload, parsed.value);

    res.status(200).json({
      ok: true,
      ...stats,
    });
  } catch (error) {
    console.error('[search] stats request failed', {
      error: error instanceof Error ? error.message : '未知搜索统计错误',
    });

    sendPayloadApiError(res, 500, 'SEARCH_STATS_FAILED', '搜索统计暂时不可用。');
  }
}

function sendPayloadHtmlError(res: SearchStatsEndpointResponse, status: number, message: string) {
  res.status(status).send(`<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>body{margin:0;padding:32px;background:#f7fbff;color:#17314f;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;font-size:14px;line-height:1.6}p{margin:0}</style>
</head>
<body><p>${escapeHtml(message)}</p></body>
</html>`);
}

async function handleSearchStatsViewEndpoint(
  req: SearchStatsEndpointRequest,
  res: SearchStatsEndpointResponse,
) {
  if (!(await hasPayloadAccess(req, 'read', 'search-logs'))) {
    sendPayloadHtmlError(res, 403, '需要管理员权限才能查看。');
    return;
  }

  const parsed = parseSearchStatsParams(req.query);
  if (!parsed.ok) {
    sendPayloadHtmlError(res, 400, '查询参数无效,请重新打开页面。');
    return;
  }

  try {
    const stats = await getSearchStatsFromPayload(req.payload, parsed.value);

    res.status(200).send(renderSearchStatsHtml(stats));
  } catch (error) {
    console.error('[search] stats view request failed', {
      error: error instanceof Error ? error.message : '未知搜索统计页面错误',
    });

    sendPayloadHtmlError(res, 500, '搜索统计暂时不可用,请稍后再试。');
  }
}

export const SearchLogs: CollectionConfig = {
  slug: 'search-logs',
  labels: {
    singular: '搜索日志',
    plural: '搜索日志',
  },
  admin: {
    useAsTitle: 'query',
    group: '运营管理',
    description: '站内搜索统计：热门关键词、零结果查询与轻量点击率。',
    defaultColumns: ['query', 'locale', 'eventType', 'hits', 'resultType', 'createdAt'],
    hidden: true,
    components: {
      BeforeList: [SearchLogsStatsPanel],
    },
  },
  access: {
    read: canRead('search-logs'),
    create: deny,
    update: deny,
    delete: deny,
  },
  endpoints: [
    {
      path: '/stats',
      method: 'get',
      handler: (req, res) => {
        void handleSearchStatsEndpoint(
          req as SearchStatsEndpointRequest,
          res as SearchStatsEndpointResponse,
        );
      },
    },
    {
      path: '/stats-view',
      method: 'get',
      handler: (req, res) => {
        void handleSearchStatsViewEndpoint(
          req as SearchStatsEndpointRequest,
          res as SearchStatsEndpointResponse,
        );
      },
    },
  ],
  fields: [
    {
      name: 'eventType',
      label: '事件类型',
      type: 'select',
      required: true,
      defaultValue: 'search',
      options: searchLogEventOptions,
      index: true,
      admin: {
        description: '区分一次搜索还是搜索结果点击。',
        readOnly: true,
      },
    },
    {
      name: 'query',
      label: '关键词',
      type: 'text',
      required: true,
      maxLength: 80,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'locale',
      label: '语言',
      type: 'select',
      required: true,
      options: localeOptions,
      index: true,
      admin: {
        description: '记录用户使用的前台语言版本。',
        readOnly: true,
      },
    },
    {
      name: 'hits',
      label: '结果数',
      type: 'number',
      required: true,
      min: 0,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'resultId',
      label: '结果 ID',
      type: 'text',
      maxLength: 120,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'resultTitle',
      label: '结果标题',
      type: 'text',
      maxLength: 180,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'resultType',
      label: '结果类型',
      type: 'select',
      options: searchResultTypeOptions,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'resultUrl',
      label: '结果链接',
      type: 'text',
      maxLength: 300,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'userId',
      label: '用户 ID',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'ip',
      label: 'IP 地址',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        readOnly: true,
      },
    },
  ],
};

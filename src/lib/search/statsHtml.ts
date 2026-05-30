import type { SearchKeywordStats, SearchStats, SearchStatsWindow } from './stats';

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

export function formatPercent(value: number, canCalculate = true) {
  return canCalculate ? `${(value * 100).toFixed(1)}%` : '暂无';
}

export function escapeHtml(value: unknown) {
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

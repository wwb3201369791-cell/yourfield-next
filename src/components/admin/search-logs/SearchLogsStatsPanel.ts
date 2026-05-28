import type { Props as ListProps } from 'payload/dist/admin/components/views/collections/List/types';
import type { CSSProperties, ReactElement } from 'react';

import type { SearchStatsWindow } from '@/lib/search/stats';
import type { SearchLocale } from '@/lib/search/types';

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

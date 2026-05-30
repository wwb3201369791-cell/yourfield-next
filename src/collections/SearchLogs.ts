import type { CollectionConfig } from 'payload';

import { canRead, deny } from '../lib/payload/access';
import { localeOptions } from '../lib/payload/fields/options';
import {
  handleSearchStatsEndpoint,
  handleSearchStatsViewEndpoint,
  type SearchStatsEndpointRequest,
  type SearchStatsEndpointResponse,
} from '../lib/search/statsEndpoints';
import { searchHitTypes } from '../lib/search/types';

export { SearchLogsStatsPanel } from '../components/admin/search-logs/SearchLogsStatsPanel';
export { renderSearchStatsHtml } from '../lib/search/statsHtml';

const searchLogEventOptions = [
  { label: '搜索', value: 'search' },
  { label: '结果点击', value: 'result-click' },
] satisfies Array<{ label: string; value: string }>;

const searchResultTypeOptions = searchHitTypes.map((value) => ({
  label: value,
  value,
}));

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
      beforeList: ['@/components/admin/search-logs/SearchLogsStatsPanel#SearchLogsStatsPanel'],
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
      handler: async (req) => {
        let response = Response.json(
          { ok: false, error: { code: 'NO_RESPONSE', message: 'No response generated.' } },
          { status: 500 },
        );
        const res: SearchStatsEndpointResponse = {
          status: (status) => ({
            json: (body) => {
              response = Response.json(body, { status });
            },
            send: (body) => {
              response = new Response(body, {
                headers: { 'content-type': 'text/html; charset=utf-8' },
                status,
              });
            },
          }),
        };
        const url = new URL(req.url ?? '/', 'http://payload.local');

        await handleSearchStatsEndpoint(
          {
            ...req,
            query: Object.fromEntries(url.searchParams.entries()),
          } as SearchStatsEndpointRequest,
          res,
        );

        return response;
      },
    },
    {
      path: '/stats-view',
      method: 'get',
      handler: async (req) => {
        let response = new Response('No response generated.', { status: 500 });
        const res: SearchStatsEndpointResponse = {
          status: (status) => ({
            json: (body) => {
              response = Response.json(body, { status });
            },
            send: (body) => {
              response = new Response(body, {
                headers: { 'content-type': 'text/html; charset=utf-8' },
                status,
              });
            },
          }),
        };
        const url = new URL(req.url ?? '/', 'http://payload.local');

        await handleSearchStatsViewEndpoint(
          {
            ...req,
            query: Object.fromEntries(url.searchParams.entries()),
          } as SearchStatsEndpointRequest,
          res,
        );

        return response;
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

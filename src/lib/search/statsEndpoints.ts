import { hasPayloadAccess } from '../payload/access';

import { getSearchStatsFromPayload, parseSearchStatsParams } from './stats';
import { escapeHtml, renderSearchStatsHtml } from './statsHtml';

type PayloadAccessRequest = Parameters<typeof hasPayloadAccess>[0];

export type SearchStatsEndpointRequest = PayloadAccessRequest &
  Readonly<{
    payload: Parameters<typeof getSearchStatsFromPayload>[0];
    query: unknown;
    user?: unknown;
  }>;

export type SearchStatsEndpointResponse = Readonly<{
  status: (status: number) => {
    json: (body: unknown) => void;
    send: (body: string) => void;
  };
}>;

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

export async function handleSearchStatsEndpoint(
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

export async function handleSearchStatsViewEndpoint(
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

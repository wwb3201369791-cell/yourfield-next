import {
  dateKey,
  parseDate,
  rangeLabelFor,
  recentDateKeys,
  safeNumber,
  shortDateLabel,
} from './format';
import type {
  DashboardChartPoint,
  DashboardFormSummary,
  DashboardRangeDays,
  DashboardState,
} from './types';

export function buildChartPoints(
  data: DashboardState,
  rangeDays: DashboardRangeDays,
): DashboardChartPoint[] {
  const points = new Map<string, { clicks: number; forms: number; searches: number }>();

  for (const key of recentDateKeys(rangeDays)) {
    points.set(key, { clicks: 0, forms: 0, searches: 0 });
  }

  for (const log of data.searchLogs.docs ?? []) {
    const parsed = parseDate(log.createdAt);
    if (!parsed) {
      continue;
    }

    const key = dateKey(parsed);
    const point = points.get(key);
    if (!point) {
      continue;
    }

    if (log.eventType === 'result-click') {
      point.clicks += 1;
    } else {
      point.searches += 1;
    }
  }

  for (const submission of data.formSubmissions.docs ?? []) {
    const parsed = parseDate(submission.createdAt);
    if (!parsed) {
      continue;
    }

    const key = dateKey(parsed);
    const point = points.get(key);
    if (point) {
      point.forms += 1;
    }
  }

  return Array.from(points.entries()).map(([key, point]) => ({
    clicks: point.clicks,
    dateKey: key,
    forms: point.forms,
    label: shortDateLabel(key),
    searches: point.searches,
    total: point.searches + point.clicks + point.forms,
  }));
}

export function latestForms(data: DashboardState): DashboardFormSummary[] {
  return (data.formSubmissions.docs ?? []).slice(0, 4).map((item) => ({
    meta: [item.company, item.inquiryType].filter(Boolean).join(' / ') || '咨询表单',
    name: item.name || '未填写姓名',
    status: item.status || 'new',
  }));
}

export function operationsInsight(data: DashboardState, rangeDays: DashboardRangeDays) {
  const rangeLabel = rangeLabelFor(rangeDays);
  const totalSearches = safeNumber(data.searchStats.totalSearches);
  const zeroResults = safeNumber(data.searchStats.zeroResultSearches);
  const newForms = safeNumber(data.newFormSubmissions.totalDocs);

  if (newForms > 0) {
    return `${rangeLabel}有 ${newForms} 条新询盘等待处理，建议优先跟进。`;
  }

  if (totalSearches > 0 && zeroResults / totalSearches > 0.25) {
    return `${rangeLabel}零结果搜索偏高，可以补充产品关键词或常见问答。`;
  }

  if (totalSearches > 0) {
    return `${rangeLabel}站内搜索已有数据积累，可以继续观察热门词和产品内容匹配度。`;
  }

  return `${rangeLabel}数据还在积累中，先保持产品与联系方式内容完整。`;
}

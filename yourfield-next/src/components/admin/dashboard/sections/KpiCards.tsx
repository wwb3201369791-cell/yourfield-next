'use client';

import { ArrowRight } from 'lucide-react';
import React from 'react';

import { numberFormat, percentFormat, rangeStartDate, safeNumber } from '../format';
import { buildAdminCollectionHref } from '../health';
import type {
  DashboardMetric,
  DashboardMetricTrendTone,
  DashboardRangeDays,
  DashboardState,
} from '../types';
import { useCountUp } from '../useCountUp';

type KpiCardsProps = Readonly<{
  adminBase: string;
  data: DashboardState;
  rangeDays: DashboardRangeDays;
  rangeLabel: string;
}>;

function trendFor(current: number, previous: number) {
  const delta = current - previous;

  if (delta === 0) {
    return { label: '持平', tone: 'flat' as DashboardMetricTrendTone };
  }

  if (previous <= 0) {
    return {
      label: `新增 ${numberFormat(Math.abs(delta))}`,
      tone: delta > 0 ? ('up' as const) : ('down' as const),
    };
  }

  return {
    label: `${delta > 0 ? '↑' : '↓'} ${percentFormat(Math.abs(delta / previous))}`,
    tone: delta > 0 ? ('up' as const) : ('down' as const),
  };
}

function KpiCard({ metric, resetKey }: Readonly<{ metric: DashboardMetric; resetKey: string }>) {
  const animatedValue = useCountUp(metric.value, { resetKey });

  return (
    <a
      className={`yourfield-ops-metric yourfield-ops-metric--${metric.tone}`}
      href={metric.href}
      data-visual={metric.visual}
    >
      <span className="yourfield-ops-metric__visual" aria-hidden="true" />
      <span className="yourfield-ops-metric__icon" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="yourfield-ops-metric__label">{metric.label}</span>
      <strong>{numberFormat(Math.round(animatedValue))}</strong>
      {metric.trendLabel ? (
        <span
          className={`yourfield-ops-metric__trend yourfield-ops-metric__trend--${metric.trendTone ?? 'flat'}`}
        >
          {metric.trendLabel}
        </span>
      ) : null}
      <span className="yourfield-ops-metric__meta">{metric.meta}</span>
      <span className="yourfield-ops-metric__drill">
        <span>点击查看</span>
        <ArrowRight aria-hidden="true" size={14} strokeWidth={2.2} />
      </span>
    </a>
  );
}

export function KpiCards({ adminBase, data, rangeDays, rangeLabel }: KpiCardsProps) {
  const rangeStartIso = rangeStartDate(rangeDays).toISOString();
  const totalSearches = safeNumber(data.searchStats.totalSearches);
  const currentForms = safeNumber(data.formSubmissions.totalDocs);
  const pendingForms = safeNumber(data.newFormSubmissions.totalDocs);
  const productCount = safeNumber(data.products.totalDocs);
  const productGroupCount = safeNumber(data.productGroups.totalDocs);
  const formsTrend = trendFor(currentForms, safeNumber(data.previousFormSubmissions.totalDocs));
  const searchesTrend = trendFor(totalSearches, safeNumber(data.previousSearchLogs.totalDocs));

  const metrics: DashboardMetric[] = [
    {
      href: buildAdminCollectionHref(adminBase, 'form-submissions', {
        'where[createdAt][greater_than_equal]': rangeStartIso,
      }),
      label: '新增询盘',
      meta:
        pendingForms > 0
          ? `${rangeLabel}待处理 ${numberFormat(pendingForms)} 条`
          : `${rangeLabel}没有待处理询盘`,
      tone: 'red',
      trendLabel: formsTrend.label,
      trendTone: formsTrend.tone,
      value: currentForms,
      visual: 'leads',
    },
    {
      href: buildAdminCollectionHref(adminBase, 'search-logs', {
        'where[createdAt][greater_than_equal]': rangeStartIso,
        'where[eventType][equals]': 'search',
      }),
      label: '站内搜索',
      meta: `${rangeLabel}点击率 ${percentFormat(data.searchStats.ctr)}`,
      tone: 'blue',
      trendLabel: searchesTrend.label,
      trendTone: searchesTrend.tone,
      value: totalSearches,
      visual: 'search',
    },
    {
      href: buildAdminCollectionHref(adminBase, 'products', {
        'where[_status][equals]': 'published',
      }),
      label: '在售产品',
      meta: `已发布产品总量 ${numberFormat(productCount)} 个`,
      tone: 'navy',
      value: productCount,
      visual: 'products',
    },
    {
      href: buildAdminCollectionHref(adminBase, 'product-groups', {
        'where[showOnFrontend][not_equals]': 'false',
      }),
      label: '展示中产品组',
      meta: `前台展示栏目 ${numberFormat(productGroupCount)} 个`,
      tone: 'amber',
      value: productGroupCount,
      visual: 'groups',
    },
  ];

  return (
    <div className="yourfield-ops-metrics" aria-label="网站运营关键指标">
      {metrics.map((metric) => (
        <KpiCard
          key={metric.label}
          metric={metric}
          resetKey={`${rangeLabel}:${metric.label}:${metric.value}`}
        />
      ))}
    </div>
  );
}

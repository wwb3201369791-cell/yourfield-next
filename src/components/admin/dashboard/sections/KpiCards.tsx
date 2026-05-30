'use client';

import { ArrowRight } from 'lucide-react';

import { useAdminText, type AdminBilingualText } from '../../adminUiLocale';
import { displayableOperationalTopKeywords } from '../deriveSearchStats';
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
  apiBase: string;
  data: DashboardState;
  rangeDays: DashboardRangeDays;
  rangeLabel: string;
}>;

type Translate = (value: AdminBilingualText) => string;

function trendFor(current: number, previous: number, t: Translate) {
  const delta = current - previous;

  if (delta === 0) {
    return { label: t('持平'), tone: 'flat' as DashboardMetricTrendTone };
  }

  if (previous <= 0) {
    return {
      label: t({
        en: `New ${numberFormat(Math.abs(delta))}`,
        zh: `新增 ${numberFormat(Math.abs(delta))}`,
      }),
      tone: delta > 0 ? ('up' as const) : ('down' as const),
    };
  }

  return {
    label: `${delta > 0 ? '↑' : '↓'} ${percentFormat(Math.abs(delta / previous))}`,
    tone: delta > 0 ? ('up' as const) : ('down' as const),
  };
}

function KpiCard({ metric, resetKey }: Readonly<{ metric: DashboardMetric; resetKey: string }>) {
  const t = useAdminText();
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
      <strong>{metric.valueLabel ?? numberFormat(Math.round(animatedValue))}</strong>
      {metric.trendLabel ? (
        <span
          className={`yourfield-ops-metric__trend yourfield-ops-metric__trend--${metric.trendTone ?? 'flat'}`}
        >
          {metric.trendLabel}
        </span>
      ) : null}
      <span className="yourfield-ops-metric__meta">{metric.meta}</span>
      <span className="yourfield-ops-metric__drill">
        <span>{t('点击查看')}</span>
        <ArrowRight aria-hidden="true" size={14} strokeWidth={2.2} />
      </span>
    </a>
  );
}

function buildSearchStatsViewHref(
  apiBase: string,
  params: Readonly<Record<string, string>>,
  hash?: string,
) {
  const search = new URLSearchParams(params);
  const query = search.toString();
  const base = apiBase.replace(/\/$/, '');

  return `${base}/search-logs/stats-view${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

export function KpiCards({ adminBase, apiBase, data, rangeDays, rangeLabel }: KpiCardsProps) {
  const t = useAdminText();
  const rangeStartIso = rangeStartDate(rangeDays).toISOString();
  const totalSearches = safeNumber(data.searchStats.totalSearches);
  const zeroResultSearches = safeNumber(data.searchStats.zeroResultSearches);
  const currentForms = safeNumber(data.formSubmissions.totalDocs);
  const pendingForms = safeNumber(data.newFormSubmissions.totalDocs);
  const productCount = safeNumber(data.products.totalDocs);
  const formsTrend = trendFor(currentForms, safeNumber(data.previousFormSubmissions.totalDocs), t);
  const searchesTrend = trendFor(totalSearches, safeNumber(data.previousSearchLogs.totalDocs), t);
  const zeroResultKeywords =
    displayableOperationalTopKeywords(data.searchStats.topKeywords)
      ?.filter((keyword) => safeNumber(keyword.zeroResultSearches) > 0)
      .map((keyword) => keyword.query?.trim())
      .filter(Boolean)
      .slice(0, 2) ?? [];

  const metrics: DashboardMetric[] = [
    {
      href: buildAdminCollectionHref(adminBase, 'form-submissions', {
        'where[createdAt][greater_than_equal]': rangeStartIso,
      }),
      label: t('新增询盘'),
      meta:
        pendingForms > 0
          ? t({
              en: `${rangeLabel} pending ${numberFormat(pendingForms)} items`,
              zh: `${rangeLabel}待处理 ${numberFormat(pendingForms)} 条`,
            })
          : t({
              en: `${rangeLabel} has no pending inquiries`,
              zh: `${rangeLabel}没有待处理询盘`,
            }),
      tone: 'red',
      trendLabel: formsTrend.label,
      trendTone: formsTrend.tone,
      value: currentForms,
      visual: 'leads',
    },
    {
      href: buildSearchStatsViewHref(apiBase, {
        createdAfter: rangeStartIso,
        limit: '100',
      }),
      label: t('站内搜索'),
      meta: t({
        en: `${rangeLabel} click-through rate ${percentFormat(data.searchStats.ctr)}`,
        zh: `${rangeLabel}点击率 ${percentFormat(data.searchStats.ctr)}`,
      }),
      tone: 'blue',
      trendLabel: searchesTrend.label,
      trendTone: searchesTrend.tone,
      value: totalSearches,
      visual: 'search',
    },
    {
      href: buildSearchStatsViewHref(apiBase, {
        createdAfter: rangeStartIso,
        limit: '100',
      }),
      label: t('点击率'),
      meta:
        zeroResultSearches > 0 && zeroResultKeywords.length > 0
          ? t({
              en: `Zero-result terms: ${zeroResultKeywords.join(', ')}`,
              zh: `零结果词：${zeroResultKeywords.join('、')}`,
            })
          : t({
              en: `${rangeLabel} search conversion`,
              zh: `${rangeLabel}搜索转化`,
            }),
      tone: 'navy',
      value: safeNumber(data.searchStats.ctr) * 100,
      valueLabel: percentFormat(data.searchStats.ctr),
      visual: 'search',
    },
    {
      href: buildAdminCollectionHref(adminBase, 'products', {
        'where[_status][equals]': 'published',
      }),
      label: t('在售产品'),
      meta: t({
        en: `${numberFormat(productCount)} published products`,
        zh: `已发布产品总量 ${numberFormat(productCount)} 个`,
      }),
      tone: 'navy',
      value: productCount,
      visual: 'products',
    },
  ];

  return (
    <div className="yourfield-ops-metrics" aria-label={t('网站运营关键指标')}>
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

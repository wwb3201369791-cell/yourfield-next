'use client';

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleCheckBig,
  Info,
} from 'lucide-react';
import React from 'react';

import { dashboardHealthLevelLabel, dashboardHealthSeverityLabel } from '../health';
import type {
  DashboardHealthItem,
  DashboardHealthResponse,
  DashboardHealthSeverity,
} from '../types';
import { useCountUp } from '../useCountUp';

type DashboardHealthPanelProps = Readonly<{
  adminBase: string;
  health: DashboardHealthResponse;
  variant?: 'detail' | 'summary';
}>;

function severityIcon(severity: DashboardHealthSeverity, isClear: boolean) {
  if (isClear) {
    return <CircleCheckBig aria-hidden="true" size={16} strokeWidth={2.2} />;
  }

  switch (severity) {
    case 'severe':
      return <CircleAlert aria-hidden="true" size={16} strokeWidth={2.2} />;
    case 'warning':
      return <AlertTriangle aria-hidden="true" size={16} strokeWidth={2.2} />;
    case 'info':
      return <Info aria-hidden="true" size={16} strokeWidth={2.2} />;
  }
}

function healthSummary(health: DashboardHealthResponse) {
  const activeItems = health.items.filter((item) => item.count > 0);

  if (activeItems.length === 0) {
    return '内容、询盘和新闻更新暂未发现明显问题。';
  }

  const severeCount = activeItems.filter((item) => item.severity === 'severe').length;
  if (severeCount > 0) {
    return `有 ${severeCount} 类问题需要优先处理。`;
  }

  return `有 ${activeItems.length} 类内容提醒可继续优化。`;
}

function severityCounts(items: DashboardHealthItem[]) {
  return {
    info: items.filter((item) => item.count > 0 && item.severity === 'info').length,
    severe: items.filter((item) => item.count > 0 && item.severity === 'severe').length,
    warning: items.filter((item) => item.count > 0 && item.severity === 'warning').length,
  };
}

function HealthRing({ health }: Readonly<{ health: DashboardHealthResponse }>) {
  const animatedScore = useCountUp(health.score, {
    resetKey: `${health.computedAt}:${health.score}`,
  });
  const score = Math.round(animatedScore);

  return (
    <div
      className={`yourfield-ops-health-ring yourfield-ops-health-ring--${health.level}`}
      aria-label={`网站内容健康度 ${health.score} 分`}
    >
      <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
        <circle className="yourfield-ops-health-ring__track" cx="60" cy="60" r="50" />
        <circle
          className="yourfield-ops-health-ring__value"
          cx="60"
          cy="60"
          r="50"
          pathLength={100}
          strokeDasharray={`${Math.max(0, Math.min(100, animatedScore))} 100`}
        />
      </svg>
      <span className="yourfield-ops-health-ring__content">
        <strong>{score}</strong>
        <span>健康度</span>
      </span>
    </div>
  );
}

function HealthItemRow({
  item,
  showClearState,
}: Readonly<{
  item: DashboardHealthItem;
  showClearState: boolean;
}>) {
  const isClear = item.count <= 0;

  return (
    <div
      className={`yourfield-ops-health-item yourfield-ops-health-item--${
        isClear ? 'good' : item.severity
      }`}
    >
      <span className="yourfield-ops-health-item__icon">
        {severityIcon(item.severity, isClear)}
      </span>
      <span className="yourfield-ops-health-item__body">
        <strong>{item.label}</strong>
        <em>
          {isClear
            ? showClearState
              ? '状态正常'
              : ''
            : `${dashboardHealthSeverityLabel(item.severity)} · ${item.count} 项`}
        </em>
      </span>
      {isClear ? null : (
        <a className="yourfield-ops-health-item__action" href={item.actionHref}>
          <span>{item.actionLabel}</span>
          <ArrowRight aria-hidden="true" size={14} strokeWidth={2.2} />
        </a>
      )}
    </div>
  );
}

export function DashboardHealthPanel({
  adminBase,
  health,
  variant = 'summary',
}: DashboardHealthPanelProps) {
  const counts = severityCounts(health.items);
  const activeItems = health.items.filter((item) => item.count > 0);
  const displayItems = variant === 'detail' ? health.items : activeItems.slice(0, 3);
  const isDetail = variant === 'detail';

  return (
    <article
      className={`yourfield-ops-panel yourfield-ops-health yourfield-ops-health--${variant}`}
    >
      <div className="yourfield-ops-panel__head">
        <div>
          <h3>{isDetail ? '网站内容健康度' : '内容健康度'}</h3>
          <p>{healthSummary(health)}</p>
        </div>
        {isDetail ? (
          <span
            className={`yourfield-ops-health-level yourfield-ops-health-level--${health.level}`}
          >
            <CheckCircle2 aria-hidden="true" size={15} strokeWidth={2.2} />
            {dashboardHealthLevelLabel(health.level)}
          </span>
        ) : (
          <a
            className="yourfield-ops-panel-link yourfield-ops-panel-link--health"
            href={`${adminBase}/health`}
          >
            <span aria-hidden="true" />
            <span>查看详情</span>
          </a>
        )}
      </div>

      <div className="yourfield-ops-health__overview">
        <HealthRing health={health} />
        <div className="yourfield-ops-health__stats" aria-label="健康度问题分类">
          <span>
            <strong>{counts.severe}</strong>
            严重
          </span>
          <span>
            <strong>{counts.warning}</strong>
            提醒
          </span>
          <span>
            <strong>{counts.info}</strong>
            观察
          </span>
        </div>
      </div>

      <div className="yourfield-ops-health-list">
        {displayItems.length > 0 ? (
          displayItems.map((item) => (
            <HealthItemRow key={item.ruleId} item={item} showClearState={isDetail} />
          ))
        ) : (
          <p className="yourfield-ops-empty">暂无需要处理的内容问题。</p>
        )}
      </div>
    </article>
  );
}

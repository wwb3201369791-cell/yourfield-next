'use client';

import { AlertTriangle, ArrowRight, CircleCheckBig, Clock3, Inbox } from 'lucide-react';

import { useAdminText, type AdminBilingualText } from '../../adminUiLocale';
import { numberFormat } from '../format';
import { buildAdminCollectionHref } from '../health';
import type { DashboardHealthRuleId, DashboardHealthSeverity, DashboardState } from '../types';

type DashboardTodoStripProps = Readonly<{
  adminBase: string;
  apiBase: string;
  data: DashboardState;
}>;

type Translate = (value: AdminBilingualText) => string;

type TodoItem = Readonly<{
  actionHref: string;
  actionLabel: string;
  description: string;
  key: string;
  label: string;
  severity: DashboardHealthSeverity;
  type: 'form' | 'health' | 'overdue';
}>;

function severityPriority(severity: DashboardHealthSeverity) {
  switch (severity) {
    case 'severe':
      return 0;
    case 'warning':
      return 1;
    case 'info':
      return 2;
  }
}

function todoIcon(type: TodoItem['type']) {
  switch (type) {
    case 'form':
      return <Inbox aria-hidden="true" size={16} strokeWidth={2.2} />;
    case 'overdue':
      return <Clock3 aria-hidden="true" size={16} strokeWidth={2.2} />;
    case 'health':
      return <AlertTriangle aria-hidden="true" size={16} strokeWidth={2.2} />;
  }
}

function healthTodoLabel(count: number, label: string, t: Translate) {
  if (count === 1 && label.includes('最近 30 天')) {
    return t(label);
  }

  return t({
    en: `${numberFormat(count)} ${t(label)}`,
    zh: `${numberFormat(count)} 项${label}`,
  });
}

function healthTodoDescription(ruleId: DashboardHealthRuleId, t: Translate) {
  switch (ruleId) {
    case 'R1':
      return t('会影响产品页第一眼可信度。');
    case 'R2':
      return t('会让前台栏目出现空内容。');
    case 'R3':
      return t('会影响英文/俄文客户浏览。');
    case 'R5':
      return t('会影响网站内容活跃度。');
    case 'R6':
      return t('客户等待时间过长，优先回复。');
  }
}

function searchStatsHref(apiBase: string) {
  const base = apiBase.replace(/\/$/, '');

  return `${base}/search-logs/stats-view?limit=100#zero-result-keywords`;
}

export function DashboardTodoStrip({ adminBase, apiBase, data }: DashboardTodoStripProps) {
  const t = useAdminText();
  const now = Date.now();
  const overdue24hCutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const pendingFormCount = data.newFormSubmissions.totalDocs ?? 0;
  const overdueFormCount = data.overdueFormSubmissions.totalDocs ?? 0;
  const freshPendingFormCount = Math.max(0, pendingFormCount - overdueFormCount);
  const zeroResultSearches = data.searchStats.zeroResultSearches ?? 0;
  const todos: TodoItem[] = [];

  if (overdueFormCount > 0) {
    todos.push({
      actionHref: buildAdminCollectionHref(adminBase, 'form-submissions', {
        'where[createdAt][less_than]': overdue24hCutoff,
        'where[status][equals]': 'new',
      }),
      actionLabel: t('去回复'),
      description: t('客户等待时间过长，优先回复。'),
      key: 'overdue-forms',
      label: t({
        en: `${numberFormat(overdueFormCount)} inquiries have been pending for more than 24 hours`,
        zh: `${numberFormat(overdueFormCount)} 条询盘超 24 小时未处理`,
      }),
      severity: 'severe',
      type: 'overdue',
    });
  }

  if (freshPendingFormCount > 0) {
    todos.push({
      actionHref: buildAdminCollectionHref(adminBase, 'form-submissions', {
        'where[status][equals]': 'new',
      }),
      actionLabel: t('去回复'),
      description: t('客户刚提交，建议当天跟进。'),
      key: 'pending-forms',
      label: t({
        en: `${numberFormat(freshPendingFormCount)} new inquiries need handling`,
        zh: `${numberFormat(freshPendingFormCount)} 条新询盘待处理`,
      }),
      severity: 'severe',
      type: 'form',
    });
  }

  if (zeroResultSearches > 0) {
    todos.push({
      actionHref: searchStatsHref(apiBase),
      actionLabel: t('查看统计'),
      description: t('说明用户想找的内容没有被命中。'),
      key: 'zero-result-searches',
      label: t({
        en: `${numberFormat(zeroResultSearches)} zero-result searches`,
        zh: `${numberFormat(zeroResultSearches)} 次零结果搜索`,
      }),
      severity: 'warning',
      type: 'health',
    });
  }

  for (const item of data.health.items) {
    if (item.count <= 0 || item.ruleId === 'R6') {
      continue;
    }

    todos.push({
      actionHref: item.actionHref,
      actionLabel: t(item.actionLabel),
      description: healthTodoDescription(item.ruleId, t),
      key: item.ruleId,
      label: healthTodoLabel(item.count, item.label, t),
      severity: item.severity,
      type: 'health',
    });
  }

  todos.sort((left, right) => severityPriority(left.severity) - severityPriority(right.severity));
  const displayedTodos = todos.slice(0, 3);

  if (todos.length === 0) {
    return (
      <article className="yourfield-ops-priorities" aria-label={t('今日优先处理')}>
        <div className="yourfield-ops-panel__head">
          <div>
            <h3>{t('今日优先处理')}</h3>
            <p>{t('按影响客户跟进和内容转化排序。')}</p>
          </div>
        </div>
        <div className="yourfield-ops-todos yourfield-ops-todos--empty" aria-label={t('运营待办')}>
          <CircleCheckBig aria-hidden="true" size={18} strokeWidth={2.2} />
          <span>{t('暂无待办 · 网站状态良好')}</span>
        </div>
      </article>
    );
  }

  return (
    <article className="yourfield-ops-priorities" aria-label={t('今日优先处理')}>
      <div className="yourfield-ops-panel__head">
        <div>
          <h3>{t('今日优先处理')}</h3>
          <p>{t('按影响客户跟进和内容转化排序。')}</p>
        </div>
      </div>
      <div className="yourfield-ops-todos" aria-label={t('运营待办')}>
        {displayedTodos.map((todo) => (
          <a
            key={todo.key}
            className={`yourfield-ops-todo-chip yourfield-ops-todo-chip--${todo.severity}`}
            href={todo.actionHref}
          >
            <span className="yourfield-ops-todo-chip__icon">{todoIcon(todo.type)}</span>
            <span className="yourfield-ops-todo-chip__body">
              <strong>{todo.label}</strong>
              <em>{todo.description}</em>
            </span>
            <span className="yourfield-ops-todo-chip__action">
              {todo.actionLabel}
              <ArrowRight aria-hidden="true" size={14} strokeWidth={2.2} />
            </span>
          </a>
        ))}
      </div>
    </article>
  );
}

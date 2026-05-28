'use client';

import { AlertTriangle, ArrowRight, CircleCheckBig, Clock3, Inbox } from 'lucide-react';
import React from 'react';

import { numberFormat } from '../format';
import { buildAdminCollectionHref } from '../health';
import type { DashboardHealthSeverity, DashboardState } from '../types';

type DashboardTodoStripProps = Readonly<{
  adminBase: string;
  data: DashboardState;
}>;

type TodoItem = Readonly<{
  actionHref: string;
  actionLabel: string;
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

function healthTodoLabel(count: number, label: string) {
  if (count === 1 && label.includes('最近 30 天')) {
    return label;
  }

  return `${numberFormat(count)} 项${label}`;
}

export function DashboardTodoStrip({ adminBase, data }: DashboardTodoStripProps) {
  const now = Date.now();
  const overdue24hCutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const pendingFormCount = data.newFormSubmissions.totalDocs ?? 0;
  const overdueFormCount = data.overdueFormSubmissions.totalDocs ?? 0;
  const freshPendingFormCount = Math.max(0, pendingFormCount - overdueFormCount);
  const todos: TodoItem[] = [];

  if (overdueFormCount > 0) {
    todos.push({
      actionHref: buildAdminCollectionHref(adminBase, 'form-submissions', {
        'where[createdAt][less_than]': overdue24hCutoff,
        'where[status][equals]': 'new',
      }),
      actionLabel: '去回复',
      key: 'overdue-forms',
      label: `${numberFormat(overdueFormCount)} 条询盘超 24 小时未处理`,
      severity: 'severe',
      type: 'overdue',
    });
  }

  if (freshPendingFormCount > 0) {
    todos.push({
      actionHref: buildAdminCollectionHref(adminBase, 'form-submissions', {
        'where[status][equals]': 'new',
      }),
      actionLabel: '去回复',
      key: 'pending-forms',
      label: `${numberFormat(freshPendingFormCount)} 条新询盘待处理`,
      severity: 'severe',
      type: 'form',
    });
  }

  for (const item of data.health.items) {
    if (item.count <= 0 || item.ruleId === 'R6') {
      continue;
    }

    todos.push({
      actionHref: item.actionHref,
      actionLabel: item.actionLabel,
      key: item.ruleId,
      label: healthTodoLabel(item.count, item.label),
      severity: item.severity,
      type: 'health',
    });
  }

  todos.sort((left, right) => severityPriority(left.severity) - severityPriority(right.severity));

  if (todos.length === 0) {
    return (
      <div className="yourfield-ops-todos yourfield-ops-todos--empty" aria-label="运营待办">
        <CircleCheckBig aria-hidden="true" size={18} strokeWidth={2.2} />
        <span>暂无待办 · 网站状态良好</span>
      </div>
    );
  }

  return (
    <div className="yourfield-ops-todos" aria-label="运营待办">
      {todos.map((todo) => (
        <a
          key={todo.key}
          className={`yourfield-ops-todo-chip yourfield-ops-todo-chip--${todo.severity}`}
          href={todo.actionHref}
        >
          {todoIcon(todo.type)}
          <span>{todo.label}</span>
          <strong>{todo.actionLabel}</strong>
          <ArrowRight aria-hidden="true" size={14} strokeWidth={2.2} />
        </a>
      ))}
    </div>
  );
}

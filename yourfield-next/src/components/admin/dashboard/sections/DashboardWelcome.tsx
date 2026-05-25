'use client';

import { ArrowRight } from 'lucide-react';
import { useAuth } from 'payload/dist/admin/components/utilities/Auth';
import React from 'react';

import { numberFormat, safeNumber } from '../format';
import { buildAdminCollectionHref } from '../health';
import type { DashboardState } from '../types';

type DashboardWelcomeProps = Readonly<{
  adminBase: string;
  data: DashboardState;
  now?: Date;
  rangeLabel: string;
}>;

type AdminUser = Readonly<{
  email?: string | null;
  name?: string | null;
  username?: string | null;
}>;

export function dashboardGreeting(now = new Date()) {
  const hour = now.getHours();

  if (hour < 12) {
    return '早上好';
  }

  if (hour < 18) {
    return '下午好';
  }

  return '晚上好';
}

export function adminDisplayName(user: AdminUser | null | undefined) {
  const name = user?.name?.trim() || user?.username?.trim();

  if (name) {
    return name;
  }

  const email = user?.email?.trim();

  if (email) {
    return email.split('@')[0] || '用户';
  }

  return '用户';
}

export function DashboardWelcome({ adminBase, data, now, rangeLabel }: DashboardWelcomeProps) {
  const { user } = useAuth<AdminUser>();
  const name = adminDisplayName(user);
  const newSubmissions = safeNumber(data.newFormSubmissions.totalDocs);
  const rangeTotal = safeNumber(data.formSubmissions.totalDocs);
  const zeroResultSearches = safeNumber(data.searchStats.zeroResultSearches);

  return (
    <section className="yourfield-dashboard-welcome" aria-label="今日运营概览">
      <div>
        <p className="yourfield-ops-dashboard__eyebrow">
          {dashboardGreeting(now)}，{name}
        </p>
        <h2>
          {newSubmissions > 0
            ? `今天优先处理 ${numberFormat(newSubmissions)} 条新咨询`
            : '今天暂无新咨询待处理'}
        </h2>
        <p>
          {rangeLabel}共收到 {numberFormat(rangeTotal)} 条询盘；站内搜索有{' '}
          {numberFormat(zeroResultSearches)} 次零结果。
        </p>
      </div>
      <a
        className="yourfield-dashboard-welcome__action"
        href={buildAdminCollectionHref(adminBase, 'form-submissions', {
          'where[status][equals]': 'new',
        })}
      >
        <span>查看新咨询</span>
        <ArrowRight aria-hidden="true" size={15} strokeWidth={2.2} />
      </a>
    </section>
  );
}

'use client';

import { useAuth } from '@payloadcms/ui';

import { useAdminText } from '../../adminUiLocale';
import { numberFormat, safeNumber } from '../format';
import type { DashboardState } from '../types';

type DashboardWelcomeProps = Readonly<{
  data: DashboardState;
  now?: Date;
  rangeLabel: string;
}>;

type AdminUser = Readonly<{
  email?: string | null;
  name?: string | null;
  username?: string | null;
}>;

function shanghaiHour(now: Date) {
  const hourText = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  }).format(now);

  return Number(hourText);
}

export function dashboardGreeting(now = new Date()) {
  const hour = shanghaiHour(now);

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

export function DashboardWelcome({ data, now, rangeLabel }: DashboardWelcomeProps) {
  const t = useAdminText();
  const { user } = useAuth<AdminUser>();
  const name = t(adminDisplayName(user));
  const newSubmissions = safeNumber(data.newFormSubmissions.totalDocs);
  const rangeTotal = safeNumber(data.formSubmissions.totalDocs);
  const zeroResultSearches = safeNumber(data.searchStats.zeroResultSearches);

  return (
    <section className="yourfield-dashboard-welcome" aria-label={t('今日运营概览')}>
      <div>
        <p className="yourfield-ops-dashboard__eyebrow">
          {t(dashboardGreeting(now))}
          {t({ en: ', ', zh: '，' })}
          {name}
        </p>
        <h2>
          {newSubmissions > 0
            ? t({
                en: `Handle ${numberFormat(newSubmissions)} new inquiries first today`,
                zh: `今天优先处理 ${numberFormat(newSubmissions)} 条新咨询`,
              })
            : t('今天暂无新咨询待处理')}
        </h2>
        <p>
          {t({
            en: `${rangeLabel} received ${numberFormat(rangeTotal)} inquiries; site search has ${numberFormat(zeroResultSearches)} zero-result searches.`,
            zh: `${rangeLabel}共收到 ${numberFormat(rangeTotal)} 条询盘；站内搜索有 ${numberFormat(zeroResultSearches)} 次零结果。`,
          })}
        </p>
      </div>
    </section>
  );
}

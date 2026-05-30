'use client';

import { Activity, Newspaper, PackagePlus, Phone, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useAdminText } from '../adminUiLocale';

import { displayableOperationalTopKeywords } from './deriveSearchStats';
import { rangeLabelFor, safeNumber } from './format';
import { buildChartPoints, latestForms } from './presentation';
import { DashboardHealthPanel } from './sections/DashboardHealthPanel';
import { DashboardTodoStrip } from './sections/DashboardTodoStrip';
import { DashboardWelcome } from './sections/DashboardWelcome';
import { FormSubmissionsList } from './sections/FormSubmissionsList';
import { KpiCards } from './sections/KpiCards';
import { RangeSwitcher } from './sections/RangeSwitcher';
import { TopKeywordsTable } from './sections/TopKeywordsTable';
import { TrendChart } from './sections/TrendChart';
import type { DashboardRangeDays, DashboardState } from './types';

type DashboardReadyProps = Readonly<{
  adminBase: string;
  apiBase: string;
  data: DashboardState;
  onRangeChange: (rangeDays: DashboardRangeDays) => void;
  onRefresh: () => void;
  rangeDays: DashboardRangeDays;
  refreshing: boolean;
}>;

function DashboardQuickLinks({ adminBase }: Readonly<{ adminBase: string }>) {
  const t = useAdminText();
  const base = adminBase.replace(/\/$/, '');
  const links = [
    {
      href: `${base}/collections/products/create`,
      icon: PackagePlus,
      label: t('新建产品'),
    },
    {
      href: `${base}/collections/news/create`,
      icon: Newspaper,
      label: t('发布新闻'),
    },
    {
      href: `${base}/globals/site-settings`,
      icon: Phone,
      label: t('编辑联系方式'),
    },
    {
      href: `${base}/health`,
      icon: Activity,
      label: t('查看内容健康'),
    },
  ];

  return (
    <nav className="yourfield-ops-quick-links" aria-label={t('快捷入口')}>
      <span>{t('快捷入口')}</span>
      {links.map(({ href, icon: Icon, label }) => (
        <a key={href} href={href}>
          <Icon aria-hidden="true" size={15} strokeWidth={2.2} />
          {label}
        </a>
      ))}
    </nav>
  );
}

export function DashboardReady({
  adminBase,
  apiBase,
  data,
  onRangeChange,
  onRefresh,
  rangeDays,
  refreshing,
}: DashboardReadyProps) {
  const t = useAdminText();
  const chartPoints = useMemo(() => buildChartPoints(data, rangeDays), [data, rangeDays]);
  const [selectedDate, setSelectedDate] = useState<string>(
    chartPoints[chartPoints.length - 1]?.dateKey ?? '',
  );
  const selectedPoint =
    chartPoints.find((point) => point.dateKey === selectedDate) ??
    chartPoints[chartPoints.length - 1];
  const rangeLabel = t(rangeLabelFor(rangeDays));
  const forms = latestForms(data);
  const topKeywords = displayableOperationalTopKeywords(data.searchStats.topKeywords).slice(0, 20);
  const zeroResultSearches = safeNumber(data.searchStats.zeroResultSearches);

  useEffect(() => {
    if (!chartPoints.some((point) => point.dateKey === selectedDate)) {
      setSelectedDate(chartPoints[chartPoints.length - 1]?.dateKey ?? '');
    }
  }, [chartPoints, selectedDate]);

  return (
    <>
      <DashboardQuickLinks adminBase={adminBase} />

      <section className="yourfield-ops-dashboard">
        <div className="yourfield-ops-dashboard__visual" aria-hidden="true" />
        <div className="yourfield-ops-dashboard__head">
          <DashboardWelcome data={data} rangeLabel={rangeLabel} />
          <div className="yourfield-ops-dashboard__actions">
            <RangeSwitcher disabled={refreshing} onChange={onRangeChange} value={rangeDays} />
            <button
              className="yourfield-ops-refresh"
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw aria-hidden="true" size={16} strokeWidth={2.2} />
              <span>{refreshing ? t('更新中') : t('刷新数据')}</span>
            </button>
          </div>
        </div>

        <div className="yourfield-ops-overview">
          <DashboardTodoStrip adminBase={adminBase} apiBase={apiBase} data={data} />
          <DashboardHealthPanel adminBase={adminBase} health={data.health} />
        </div>

        <KpiCards
          adminBase={adminBase}
          apiBase={apiBase}
          data={data}
          rangeDays={rangeDays}
          rangeLabel={rangeLabel}
        />

        <div className="yourfield-ops-layout yourfield-ops-layout--primary">
          <TrendChart
            chartPoints={chartPoints}
            onSelectDate={setSelectedDate}
            rangeLabel={rangeLabel}
            selectedPoint={selectedPoint}
          />
          <FormSubmissionsList adminBase={adminBase} forms={forms} />
        </div>

        <TopKeywordsTable
          apiBase={apiBase}
          topKeywords={topKeywords}
          zeroResultSearches={zeroResultSearches}
        />
      </section>
    </>
  );
}

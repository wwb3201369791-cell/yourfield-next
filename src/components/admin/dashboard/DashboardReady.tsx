'use client';

import { RefreshCw } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { displayableOperationalTopKeywords } from './deriveSearchStats';
import { rangeLabelFor, safeNumber } from './format';
import { buildChartPoints, latestForms, operationsInsight } from './presentation';
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

export function DashboardReady({
  adminBase,
  apiBase,
  data,
  onRangeChange,
  onRefresh,
  rangeDays,
  refreshing,
}: DashboardReadyProps) {
  const chartPoints = useMemo(() => buildChartPoints(data, rangeDays), [data, rangeDays]);
  const [selectedDate, setSelectedDate] = useState<string>(
    chartPoints[chartPoints.length - 1]?.dateKey ?? '',
  );
  const selectedPoint =
    chartPoints.find((point) => point.dateKey === selectedDate) ??
    chartPoints[chartPoints.length - 1];
  const rangeLabel = rangeLabelFor(rangeDays);
  const insight = operationsInsight(data, rangeDays);
  const forms = latestForms(data);
  const topKeywords = displayableOperationalTopKeywords(data.searchStats.topKeywords).slice(0, 20);
  const zeroResultSearches = safeNumber(data.searchStats.zeroResultSearches);

  useEffect(() => {
    if (!chartPoints.some((point) => point.dateKey === selectedDate)) {
      setSelectedDate(chartPoints[chartPoints.length - 1]?.dateKey ?? '');
    }
  }, [chartPoints, selectedDate]);

  return (
    <section className="yourfield-ops-dashboard">
      <div className="yourfield-ops-dashboard__visual" aria-hidden="true" />
      <DashboardWelcome adminBase={adminBase} data={data} rangeLabel={rangeLabel} />
      <div className="yourfield-ops-dashboard__head">
        <div>
          <p className="yourfield-ops-dashboard__eyebrow">运营数据</p>
          <h2>网站运营看板</h2>
          <p>{insight}</p>
        </div>
        <div className="yourfield-ops-dashboard__actions">
          <RangeSwitcher disabled={refreshing} onChange={onRangeChange} value={rangeDays} />
          <button
            className="yourfield-ops-refresh"
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw aria-hidden="true" size={16} strokeWidth={2.2} />
            <span>{refreshing ? '更新中' : '刷新数据'}</span>
          </button>
        </div>
      </div>

      <DashboardTodoStrip adminBase={adminBase} data={data} />

      <KpiCards
        adminBase={adminBase}
        apiBase={apiBase}
        data={data}
        rangeDays={rangeDays}
        rangeLabel={rangeLabel}
      />

      <div className="yourfield-ops-layout">
        <DashboardHealthPanel adminBase={adminBase} health={data.health} />
        <TopKeywordsTable
          apiBase={apiBase}
          topKeywords={topKeywords}
          zeroResultSearches={zeroResultSearches}
        />
        <TrendChart
          chartPoints={chartPoints}
          onSelectDate={setSelectedDate}
          rangeLabel={rangeLabel}
          selectedPoint={selectedPoint}
        />
        <FormSubmissionsList adminBase={adminBase} forms={forms} />
      </div>
    </section>
  );
}

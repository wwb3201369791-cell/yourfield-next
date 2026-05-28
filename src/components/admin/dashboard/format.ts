import { dashboardRangeOptions, type DashboardRangeDays } from './types';

export function numberFormat(value: number | undefined) {
  return new Intl.NumberFormat('zh-CN').format(value ?? 0);
}

export function percentFormat(value: number | undefined) {
  return `${(((value ?? 0) * 1000) / 10).toFixed(1)}%`;
}

export function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function shortDateLabel(key: string) {
  const [, month = '', day = ''] = key.split('-');

  return `${month}/${day}`;
}

export function parseDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function rangeLabelFor(rangeDays: DashboardRangeDays) {
  return dashboardRangeOptions.find((option) => option.value === rangeDays)?.label ?? '当前范围';
}

export function rangeStartDate(rangeDays: DashboardRangeDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (rangeDays - 1));

  return date;
}

export function recentDateKeys(rangeDays: DashboardRangeDays) {
  return Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (rangeDays - index - 1));

    return dateKey(date);
  });
}

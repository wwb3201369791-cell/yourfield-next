import React from 'react';

import { dashboardRangeOptions, type DashboardRangeDays } from '../types';

type RangeSwitcherProps = Readonly<{
  disabled: boolean;
  onChange: (rangeDays: DashboardRangeDays) => void;
  value: DashboardRangeDays;
}>;

export function RangeSwitcher({ disabled, onChange, value }: RangeSwitcherProps) {
  const selectedIndex = dashboardRangeOptions.findIndex((option) => option.value === value);

  return (
    <div
      className="yourfield-ops-range"
      role="group"
      aria-label="切换运营数据日期范围"
      style={{ '--range-index': Math.max(0, selectedIndex) } as React.CSSProperties}
    >
      <span className="yourfield-ops-range__thumb" aria-hidden="true" />
      {dashboardRangeOptions.map((option) => (
        <button
          key={option.value}
          className={option.value === value ? 'is-active' : undefined}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
        >
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

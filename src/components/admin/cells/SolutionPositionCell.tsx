'use client';

import React from 'react';

type CellProps = Readonly<{
  cellData?: unknown;
  data?: unknown;
  rowData?: Readonly<Record<string, unknown>>;
}>;

function numericOrder(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function positionLabel(order: number | null) {
  if (order === null || order <= 0) {
    return '未设置';
  }

  return `第 ${order} 位`;
}

export default function SolutionPositionCell({ cellData, data, rowData }: CellProps) {
  const order = numericOrder(data) ?? numericOrder(cellData) ?? numericOrder(rowData?.order);

  return <span className="yf-position-badge">{positionLabel(order)}</span>;
}

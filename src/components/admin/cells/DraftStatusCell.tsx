'use client';

import React from 'react';

import { StatusBadge, type StatusMapping } from './StatusBadge';

export const draftStatusMapping: StatusMapping = {
  draft: { label: '草稿', tone: 'neutral' },
  published: { label: '已发布', mark: '✓', tone: 'success' },
};

type CellProps = Readonly<{
  cellData?: unknown;
  data?: unknown;
  rowData?: Readonly<Record<string, unknown>>;
}>;

function cellValue({ cellData, data, rowData }: CellProps) {
  const value = rowData?._status ?? data ?? cellData;

  return typeof value === 'string' ? value : null;
}

export default function DraftStatusCell(props: CellProps) {
  return <StatusBadge mapping={draftStatusMapping} value={cellValue(props)} />;
}

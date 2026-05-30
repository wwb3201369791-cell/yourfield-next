'use client';

import { StatusBadge, type StatusMapping } from './StatusBadge';

export const submissionStatusMapping: StatusMapping = {
  closed: { label: '已关闭', tone: 'neutral' },
  new: { label: '新咨询', tone: 'danger' },
  processing: { label: '处理中', tone: 'warning' },
  replied: { label: '已回复', tone: 'success' },
};

type CellProps = Readonly<{
  cellData?: unknown;
  data?: unknown;
}>;

function cellValue({ cellData, data }: CellProps) {
  const value = data ?? cellData;

  return typeof value === 'string' ? value : null;
}

export default function SubmissionStatusCell(props: CellProps) {
  return <StatusBadge mapping={submissionStatusMapping} value={cellValue(props)} />;
}

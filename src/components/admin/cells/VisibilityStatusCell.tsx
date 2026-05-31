'use client';

import { StatusBadge, type StatusMapping } from './StatusBadge';

const visibilityStatusMapping: StatusMapping = {
  hidden: { label: '隐藏', tone: 'neutral' },
  visible: { label: '显示', mark: '✓', tone: 'success' },
};

type CellProps = Readonly<{
  cellData?: unknown;
  data?: unknown;
  rowData?: Readonly<Record<string, unknown>>;
}>;

function booleanValue(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }
  }

  return null;
}

export default function VisibilityStatusCell({ cellData, data, rowData }: CellProps) {
  const value =
    booleanValue(rowData?.showOnFrontend) ?? booleanValue(data) ?? booleanValue(cellData);

  return (
    <StatusBadge mapping={visibilityStatusMapping} value={value === false ? 'hidden' : 'visible'} />
  );
}

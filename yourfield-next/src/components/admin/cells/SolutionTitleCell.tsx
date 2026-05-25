'use client';

import { useConfig } from 'payload/dist/admin/components/utilities/Config';
import React from 'react';

type CellProps = Readonly<{
  cellData?: unknown;
  rowData?: Readonly<Record<string, unknown>>;
}>;

function readableText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === 'object') {
    const localized = Object.values(value).find(
      (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
    );

    return localized?.trim() ?? null;
  }

  return null;
}

function documentId(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null;
}

export default function SolutionTitleCell({ cellData, rowData }: CellProps) {
  const { routes } = useConfig();
  const title = readableText(rowData?.title) ?? readableText(cellData) ?? '未命名方案';
  const id = documentId(rowData?.id);

  if (!id) {
    return <span>{title}</span>;
  }

  return (
    <a className="yf-solution-title-link" href={`${routes.admin}/collections/solutions/${id}`}>
      {title}
    </a>
  );
}

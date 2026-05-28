'use client';

import React from 'react';

export type StatusTone = 'danger' | 'neutral' | 'success' | 'warning';

export type StatusVisual = Readonly<{
  label: string;
  mark?: string;
  tone: StatusTone;
}>;

export type StatusMapping = Readonly<Record<string, StatusVisual>>;

type StatusBadgeProps = Readonly<{
  mapping: StatusMapping;
  value: string | null | undefined;
}>;

function normalizedValue(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function StatusBadge({ mapping, value }: StatusBadgeProps) {
  const status = normalizedValue(value);

  if (!status) {
    return null;
  }

  const visual = mapping[status] ?? { label: status, tone: 'neutral' as const };

  return (
    <span
      className={`yf-status-badge yf-status-badge--${visual.tone}`}
      data-status={status}
    >
      {visual.mark ? (
        <span className="yf-status-badge__mark" aria-hidden="true">
          {visual.mark}
        </span>
      ) : null}
      <span>{visual.label}</span>
    </span>
  );
}

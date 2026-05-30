'use client';

import { useAdminText } from '../adminUiLocale';

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
  const t = useAdminText();
  const status = normalizedValue(value);

  if (!status) {
    return null;
  }

  const visual = mapping[status] ?? { label: status, tone: 'neutral' as const };
  const className = [
    'yf-status-badge',
    `yf-status-badge--${visual.tone}`,
    visual.mark ? 'yf-status-badge--has-mark' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={className} data-status={status}>
      {visual.mark ? (
        <span className="yf-status-badge__mark" aria-hidden="true">
          {visual.mark}
        </span>
      ) : null}
      <span className="yf-status-badge__label">{t(visual.label)}</span>
    </span>
  );
}

// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import DraftStatusCell from '@/components/admin/cells/DraftStatusCell';
import SubmissionStatusCell from '@/components/admin/cells/SubmissionStatusCell';
import { StatusBadge, type StatusMapping } from '@/components/admin/cells/StatusBadge';

const mapping: StatusMapping = {
  closed: { label: '已关闭', tone: 'neutral' },
  new: { label: '新咨询', mark: '●', tone: 'danger' },
  processing: { label: '处理中', mark: '●', tone: 'warning' },
  replied: { label: '已回复', mark: '✓', tone: 'success' },
};

afterEach(cleanup);

describe('StatusBadge', () => {
  it('renders the mapped label and status marker', () => {
    render(<StatusBadge mapping={mapping} value="new" />);

    expect(screen.getByText('新咨询')).toBeTruthy();
    expect(screen.getByText('●')).toBeTruthy();
    expect(
      screen.getByText('新咨询').closest('.yf-status-badge')?.getAttribute('data-status'),
    ).toBe('new');
  });

  it('uses the configured tone as a stable styling hook', () => {
    render(<StatusBadge mapping={mapping} value="processing" />);

    const badge = screen.getByText('处理中').closest('.yf-status-badge');

    expect(badge?.classList.contains('yf-status-badge--warning')).toBe(true);
  });

  it('does not render a marker when the mapping has none', () => {
    render(<StatusBadge mapping={mapping} value="closed" />);

    expect(screen.getByText('已关闭').classList.contains('yf-status-badge__label')).toBe(true);
    expect(screen.queryByText('●')).toBeNull();
    expect(screen.queryByText('✓')).toBeNull();
  });

  it('falls back to the raw value for unknown statuses', () => {
    render(<StatusBadge mapping={mapping} value="unexpected" />);

    expect(screen.getByText('unexpected')).toBeTruthy();
    expect(
      screen
        .getByText('unexpected')
        .closest('.yf-status-badge')
        ?.classList.contains('yf-status-badge--neutral'),
    ).toBe(true);
  });

  it('renders nothing for empty values', () => {
    const { container } = render(<StatusBadge mapping={mapping} value={null} />);

    expect(container.textContent).toBe('');
  });

  it('renders form submission new status without an extra red marker', () => {
    render(createElement(SubmissionStatusCell, { cellData: 'new' }));

    expect(screen.getByText('新咨询')).toBeTruthy();
    expect(
      screen.getByText('新咨询').closest('.yf-status-badge')?.getAttribute('data-status'),
    ).toBe('new');
    expect(screen.queryByText('●')).toBeNull();
  });

  it('renders form submission workflow statuses without text markers', () => {
    const { rerender } = render(createElement(SubmissionStatusCell, { cellData: 'processing' }));

    expect(screen.getByText('处理中')).toBeTruthy();
    expect(screen.queryByText('●')).toBeNull();

    rerender(createElement(SubmissionStatusCell, { cellData: 'replied' }));

    expect(screen.getByText('已回复')).toBeTruthy();
    expect(screen.queryByText('✓')).toBeNull();
  });

  it('renders draft status from Payload row data for virtual list columns', () => {
    render(createElement(DraftStatusCell, { rowData: { _status: 'published', id: 1 } }));

    expect(screen.getByText('已发布')).toBeTruthy();
    expect(
      screen.getByText('已发布').closest('.yf-status-badge')?.getAttribute('data-status'),
    ).toBe('published');
  });
});

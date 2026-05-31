// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FormSubmissions } from '@/collections/FormSubmissions';
import {
  buildFormSubmissionAllRecordsHref,
  buildFormSubmissionArchivedHref,
  buildFormSubmissionPriorityHref,
  buildFormSubmissionQuickFilterHref,
  buildFormSubmissionResetHref,
  buildFormSubmissionUnassignedHref,
  FormSubmissionsStatusTabs,
} from '@/components/admin/list/FormSubmissionsStatusTabs';
import {
  buildStatusCountUrl,
  buildStatusTabHref,
  statusFromSearch,
  StatusTabs,
  type StatusTabOption,
} from '@/components/admin/list/StatusTabs';

vi.mock('@payloadcms/ui', () => ({
  useConfig: () => ({
    config: {
      routes: {
        admin: '/admin-panel',
        api: '/payload-api',
      },
    },
  }),
  useTranslation: () => ({ i18n: { language: 'zh' } }),
}));

const options: readonly StatusTabOption[] = [
  { label: '全部' },
  { label: '新咨询', value: 'new' },
  { label: '处理中', value: 'processing' },
  { label: '已回复', value: 'replied' },
  { label: '已关闭', value: 'closed' },
];

function requestUrl(path: RequestInfo | URL) {
  if (typeof path === 'string') {
    return path;
  }

  if (path instanceof URL) {
    return path.toString();
  }

  return path.url;
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState({}, '', '/');
});

describe('admin status tabs', () => {
  it('builds filter links without losing unrelated list params', () => {
    expect(
      buildStatusTabHref(
        '/admin/',
        'form-submissions',
        'new',
        '?page=2&sort=-createdAt&where[status][equals]=closed',
      ),
    ).toBe('/admin/collections/form-submissions?sort=-createdAt&where%5Bstatus%5D%5Bequals%5D=new');
    expect(statusFromSearch('?where%5Bstatus%5D%5Bequals%5D=processing')).toBe('processing');
    expect(buildStatusCountUrl('/payload-api/', 'form-submissions', 'closed')).toBe(
      '/payload-api/form-submissions?depth=0&limit=0&where%5Bstatus%5D%5Bequals%5D=closed',
    );
  });

  it('renders active tabs and loads counts from the configured API route', async () => {
    window.history.replaceState(
      {},
      '',
      '/admin/collections/form-submissions?where[status][equals]=processing',
    );
    const totals: Record<string, number> = {
      all: 9,
      closed: 1,
      new: 3,
      processing: 2,
      replied: 3,
    };
    const fetchMock = vi.fn((path: RequestInfo | URL) => {
      const url = requestUrl(path);
      const params = new URLSearchParams(url.split('?')[1] ?? '');
      const status = params.get('where[status][equals]') ?? 'all';

      return jsonResponse({ totalDocs: totals[status] ?? 0 });
    });

    vi.stubGlobal('fetch', fetchMock);

    render(
      <StatusTabs
        adminBase="/admin"
        apiBase="/payload-api"
        collectionSlug="form-submissions"
        options={options}
        title="咨询状态快筛"
      />,
    );

    expect(screen.getByRole('link', { name: '处理中' }).getAttribute('aria-current')).toBe('page');

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /全部/ }).textContent).toBe('全部9');
      expect(screen.getByRole('link', { name: /新咨询/ }).textContent).toBe('新咨询3');
      expect(screen.getByRole('link', { name: /处理中/ }).textContent).toBe('处理中2');
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/payload-api/form-submissions?depth=0&limit=0',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
  });

  it('mounts the form submissions workbench around the list', () => {
    expect(FormSubmissions.admin?.components?.beforeList).toContain(
      '@/components/admin/list/FormSubmissionsStatusTabs#FormSubmissionsStatusTabs',
    );
    expect(FormSubmissions.admin?.components?.afterList).toBeUndefined();
    expect(FormSubmissions.admin?.listSearchableFields).toEqual([
      'name',
      'phone',
      'email',
      'company',
    ]);
  });

  it('builds form submission quick filters and manager metric links', () => {
    const href = buildFormSubmissionQuickFilterHref(
      '/admin',
      'franchise',
      '?page=2&where[status][equals]=new&where[inquiryType][equals]=message&where[createdAt][greater_than_equal]=2026-05-29T00%3A00%3A00.000Z',
    );
    const params = new URL(href, 'http://example.com').searchParams;

    expect(params.get('page')).toBeNull();
    expect(params.get('where[status][equals]')).toBe('new');
    expect(params.get('where[inquiryType][equals]')).toBe('franchise');
    expect(params.get('where[createdAt][greater_than_equal]')).toBe('2026-05-29T00:00:00.000Z');

    const allTypesHref = buildFormSubmissionQuickFilterHref(
      '/admin',
      undefined,
      '?where[inquiryType][equals]=message&where[createdAt][greater_than_equal]=2026-05-29T00%3A00%3A00.000Z',
    );
    const allTypesParams = new URL(allTypesHref, 'http://example.com').searchParams;

    expect(allTypesParams.get('where[inquiryType][equals]')).toBeNull();
    expect(allTypesParams.get('where[createdAt][greater_than_equal]')).toBe(
      '2026-05-29T00:00:00.000Z',
    );

    const unassignedHref = buildFormSubmissionUnassignedHref(
      '/admin',
      '?where[assignedTo][exists]=true&where[status][equals]=processing',
    );
    const unassignedParams = new URL(unassignedHref, 'http://example.com').searchParams;

    expect(unassignedParams.get('where[assignedTo][exists]')).toBe('false');
    expect(unassignedParams.get('where[status][equals]')).toBeNull();
    expect(buildFormSubmissionResetHref('/admin/')).toBe('/admin/collections/form-submissions');
  });

  it('builds non-redundant form submission work view links', () => {
    const priorityHref = buildFormSubmissionPriorityHref(
      '/admin',
      '?page=2&where[status][equals]=closed&where[inquiryType][equals]=message&where[createdAt][greater_than_equal]=2026-05-29T00%3A00%3A00.000Z',
    );
    const priorityParams = new URL(priorityHref, 'http://example.com').searchParams;

    expect(priorityParams.get('page')).toBeNull();
    expect(priorityParams.get('where[inquiryType][equals]')).toBe('message');
    expect(priorityParams.get('where[or][0][status][equals]')).toBe('new');
    expect(priorityParams.get('where[or][1][assignedTo][exists]')).toBe('false');
    expect(priorityParams.get('where[createdAt][greater_than_equal]')).toBeNull();

    const archivedHref = buildFormSubmissionArchivedHref(
      '/admin',
      '?where[assignedTo][exists]=false&where[inquiryType][equals]=franchise',
    );
    const archivedParams = new URL(archivedHref, 'http://example.com').searchParams;

    expect(archivedParams.get('where[inquiryType][equals]')).toBe('franchise');
    expect(archivedParams.get('where[or][0][status][equals]')).toBe('replied');
    expect(archivedParams.get('where[or][1][status][equals]')).toBe('closed');
    expect(archivedParams.get('where[assignedTo][exists]')).toBeNull();

    const allHref = buildFormSubmissionAllRecordsHref(
      '/admin',
      '?where[or][0][status][equals]=new&where[or][1][assignedTo][exists]=false&where[inquiryType][equals]=franchise',
    );
    const allParams = new URL(allHref, 'http://example.com').searchParams;

    expect(allParams.get('where[inquiryType][equals]')).toBe('franchise');
    expect(allParams.get('where[or][0][status][equals]')).toBeNull();
    expect(allParams.get('where[or][1][assignedTo][exists]')).toBeNull();
  });

  it('uses concise operator copy for form submission status filters', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => jsonResponse({ totalDocs: 0 })),
    );
    window.history.replaceState(
      {},
      '',
      '/admin/collections/form-submissions?where[inquiryType][equals]=franchise&where[status][equals]=new',
    );

    render(<FormSubmissionsStatusTabs />);

    expect(screen.getByRole('region', { name: '咨询表单' }).textContent).toContain('咨询线索');
    expect(screen.queryByText('咨询处理工作台')).toBeNull();
    expect(screen.queryByText('咨询表单', { selector: '.yf-form-workbench__crumb' })).toBeNull();
    expect(screen.queryByText('咨询状态快筛')).toBeNull();
    expect(screen.queryByText(/刷新后筛选/)).toBeNull();
    expect(screen.queryByText('处理新咨询')).toBeNull();
    expect(screen.queryByText('待跟进')).toBeNull();
    expect(screen.queryByText('流转')).toBeNull();
    expect(screen.queryByText('今日提交')).toBeNull();
    expect(screen.getByText('工作视图')).toBeTruthy();
    expect(screen.getByText('当前筛选：优先处理 · 招商咨询')).toBeTruthy();
    expect(screen.getByRole('link', { name: '优先处理' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.getByRole('link', { name: '招商咨询' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.getByRole('link', { name: '重置搜索' }).getAttribute('href')).toBe(
      '/admin-panel/collections/form-submissions',
    );
  });

  it('shows metric-only filters in the current filter summary', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => jsonResponse({ totalDocs: 0 })),
    );
    window.history.replaceState(
      {},
      '',
      '/admin/collections/form-submissions?where[createdAt][greater_than_equal]=2026-05-31T00%3A00%3A00.000Z&where[inquiryType][equals]=message',
    );

    render(<FormSubmissionsStatusTabs />);

    expect(screen.getByText('当前筛选：今日新增 · 留言咨询')).toBeTruthy();
  });

  it('reloads manager metric counts when the Payload list data changes after mutations', async () => {
    const priorityTotals = [1, 0];
    const fetchMock = vi.fn((path: RequestInfo | URL) => {
      const url = decodeURIComponent(requestUrl(path));

      if (url.includes('where[or][0][status][equals]=new')) {
        return jsonResponse({ totalDocs: priorityTotals.shift() ?? 0 });
      }

      return jsonResponse({ totalDocs: 0 });
    });

    vi.stubGlobal('fetch', fetchMock);

    const { rerender } = render(
      <FormSubmissionsStatusTabs
        data={{
          docs: [{ assignedTo: '', id: 1, status: 'new', updatedAt: '2026-05-30T00:00:00.000Z' }],
          limit: 10,
          page: 1,
          pagingCounter: 1,
          totalDocs: 1,
          totalPages: 1,
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /待处理/ }).textContent).toContain('1');
    });

    rerender(
      <FormSubmissionsStatusTabs
        data={{
          docs: [],
          limit: 10,
          page: 1,
          pagingCounter: 0,
          totalDocs: 0,
          totalPages: 1,
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /待处理/ }).textContent).toContain('0');
    });
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  describe('with payload list-filter nested where clauses', () => {
    const nestedNew = 'where%5Bor%5D%5B0%5D%5Band%5D%5B0%5D%5Bstatus%5D%5Bequals%5D=new';

    it('reads active status from a nested or/and clause', () => {
      expect(statusFromSearch(`?${nestedNew}`)).toBe('new');
    });

    it('reads active status from a single and clause', () => {
      expect(statusFromSearch('?where%5Band%5D%5B0%5D%5Bstatus%5D%5Bequals%5D=processing')).toBe(
        'processing',
      );
    });

    it('returns empty when nested clauses point at different statuses', () => {
      expect(
        statusFromSearch(
          '?where%5Bor%5D%5B0%5D%5Band%5D%5B0%5D%5Bstatus%5D%5Bequals%5D=new&where%5Bor%5D%5B1%5D%5Band%5D%5B0%5D%5Bstatus%5D%5Bequals%5D=processing',
        ),
      ).toBe('');
    });

    it('does not treat lookalike fields as a status filter', () => {
      expect(statusFromSearch('?where%5Band%5D%5B0%5D%5BcustomerStatus%5D%5Bequals%5D=new')).toBe(
        '',
      );
    });

    it('strips nested status clauses when switching tabs', () => {
      const href = buildStatusTabHref(
        '/admin',
        'form-submissions',
        'processing',
        `?limit=10&sort=-inquiryType&${nestedNew}`,
      );
      const params = new URL(href, 'http://example.com').searchParams;

      for (const key of Array.from(params.keys())) {
        if (key.includes('[status]')) {
          expect(key).toBe('where[status][equals]');
        }
      }

      expect(params.get('where[status][equals]')).toBe('processing');
      expect(params.get('limit')).toBe('10');
      expect(params.get('sort')).toBe('-inquiryType');
    });

    it('clears nested status clauses when switching to "all"', () => {
      expect(buildStatusTabHref('/admin', 'form-submissions', undefined, `?${nestedNew}`)).toBe(
        '/admin/collections/form-submissions',
      );
    });

    it('keeps unrelated nested filters when switching tabs', () => {
      const href = buildStatusTabHref(
        '/admin',
        'form-submissions',
        'closed',
        `?${nestedNew}&where%5Band%5D%5B0%5D%5Bcompany%5D%5Bequals%5D=foo`,
      );
      const params = new URL(href, 'http://example.com').searchParams;

      expect(params.get('where[status][equals]')).toBe('closed');
      expect(params.get('where[and][0][company][equals]')).toBe('foo');
    });
  });
});

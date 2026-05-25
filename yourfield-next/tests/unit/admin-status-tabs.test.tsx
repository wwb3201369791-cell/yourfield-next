// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FormSubmissions } from '@/collections/FormSubmissions';
import { FormSubmissionsListGuide } from '@/components/admin/list/FormSubmissionsListGuide';
import { FormSubmissionsStatusTabs } from '@/components/admin/list/FormSubmissionsStatusTabs';
import {
  buildStatusCountUrl,
  buildStatusTabHref,
  statusFromSearch,
  StatusTabs,
  type StatusTabOption,
} from '@/components/admin/list/StatusTabs';

vi.mock('payload/dist/admin/components/utilities/Config', () => ({
  useConfig: () => ({
    routes: {
      admin: '/admin-panel',
      api: '/payload-api',
    },
  }),
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

  it('mounts the form submissions quick filters and guide around the list', () => {
    expect(FormSubmissions.admin?.components?.BeforeList).toContain(FormSubmissionsStatusTabs);
    expect(FormSubmissions.admin?.components?.AfterList).toContain(FormSubmissionsListGuide);
  });

  it('uses concise operator copy for form submission status filters', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => jsonResponse({ totalDocs: 0 })),
    );

    render(<FormSubmissionsStatusTabs />);

    expect(screen.getByRole('region', { name: '咨询状态' }).textContent).toContain('新咨询');
    expect(screen.queryByText('咨询状态快筛')).toBeNull();
    expect(screen.queryByText(/刷新后筛选/)).toBeNull();
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

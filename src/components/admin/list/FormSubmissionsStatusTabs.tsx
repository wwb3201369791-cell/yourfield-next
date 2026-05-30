'use client';

import { useConfig } from '@payloadcms/ui';
import { useEffect, useMemo, useState } from 'react';

import { useAdminText } from '../adminUiLocale';

type CountResponse = Readonly<{
  totalDocs?: number;
}>;

type ListDataRefreshSource = Readonly<{
  docs?: readonly (Readonly<Record<string, unknown>> & {
    id?: string | number;
    updatedAt?: string;
  })[];
  limit?: number;
  page?: number;
  pagingCounter?: number;
  totalDocs?: number;
  totalPages?: number;
}>;

type FormSubmissionsStatusTabsProps = Readonly<{
  data?: ListDataRefreshSource;
}>;

type SubmissionCountKey = 'archived' | 'priority' | 'today' | 'unassigned';

type SubmissionCounts = Partial<Record<SubmissionCountKey, number>>;

const collectionSlug = 'form-submissions';

const metricCards: readonly {
  accent?: 'hot';
  countKey: SubmissionCountKey;
  label: string;
  tone: string;
}[] = [
  { accent: 'hot', countKey: 'priority', label: '待处理', tone: '新线索 / 未分配' },
  { countKey: 'unassigned', label: '未分配', tone: '缺负责人' },
  { countKey: 'today', label: '今日新增', tone: '当天提交' },
  { countKey: 'archived', label: '已完成', tone: '回复 / 关闭' },
];

type QuickFilter = Readonly<{
  label: string;
  value?: string;
}>;

const quickFilters: readonly QuickFilter[] = [
  { label: '全部类型' },
  { label: '招商咨询', value: 'franchise' },
  { label: '留言咨询', value: 'message' },
] as const;

const INQUIRY_TYPE_CLAUSE_PATTERN = /^where(?:\[[^\]]+\])*\[inquiryType\]\[[a-z_]+\]$/;
const WORK_VIEW_CLAUSE_PATTERN =
  /^where(?:\[[^\]]+\])*\[(assignedTo|createdAt|status)\]\[[a-z_]+\]$/;
const ASSIGNED_TO_CLAUSE_PATTERN = /^where(?:\[[^\]]+\])*\[assignedTo\]\[[a-z_]+\]$/;
const STATUS_CLAUSE_PATTERN = /^where(?:\[[^\]]+\])*\[status\]\[[a-z_]+\]$/;

function normalizedBase(path: string) {
  return path.replace(/\/$/, '');
}

function currentSearch() {
  return typeof window === 'undefined' ? '' : window.location.search;
}

function startOfTodayIso() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date.toISOString();
}

function buildCollectionHref(adminBase: string, search = '') {
  const query = new URLSearchParams(search).toString();

  return `${normalizedBase(adminBase)}/collections/${collectionSlug}${query ? `?${query}` : ''}`;
}

export function buildFormSubmissionQuickFilterHref(
  adminBase: string,
  inquiryType: string | undefined,
  search = '',
) {
  const params = new URLSearchParams(search);

  for (const key of Array.from(params.keys())) {
    if (key === 'page' || INQUIRY_TYPE_CLAUSE_PATTERN.test(key)) {
      params.delete(key);
    }
  }

  if (inquiryType) {
    params.set('where[inquiryType][equals]', inquiryType);
  }

  return buildCollectionHref(adminBase, params.toString());
}

export function buildFormSubmissionResetHref(adminBase: string) {
  return buildCollectionHref(adminBase);
}

export function buildFormSubmissionTodayHref(adminBase: string, search = '') {
  const params = new URLSearchParams(search);

  for (const key of Array.from(params.keys())) {
    if (key === 'page' || WORK_VIEW_CLAUSE_PATTERN.test(key)) {
      params.delete(key);
    }
  }

  params.set('where[createdAt][greater_than_equal]', startOfTodayIso());

  return buildCollectionHref(adminBase, params.toString());
}

export function buildFormSubmissionAllRecordsHref(adminBase: string, search = '') {
  const params = new URLSearchParams(search);

  for (const key of Array.from(params.keys())) {
    if (key === 'page' || WORK_VIEW_CLAUSE_PATTERN.test(key)) {
      params.delete(key);
    }
  }

  return buildCollectionHref(adminBase, params.toString());
}

export function buildFormSubmissionPriorityHref(adminBase: string, search = '') {
  const params = new URLSearchParams(search);

  for (const key of Array.from(params.keys())) {
    if (key === 'page' || WORK_VIEW_CLAUSE_PATTERN.test(key)) {
      params.delete(key);
    }
  }

  params.set('where[or][0][status][equals]', 'new');
  params.set('where[or][1][assignedTo][exists]', 'false');

  return buildCollectionHref(adminBase, params.toString());
}

export function buildFormSubmissionArchivedHref(adminBase: string, search = '') {
  const params = new URLSearchParams(search);

  for (const key of Array.from(params.keys())) {
    if (key === 'page' || WORK_VIEW_CLAUSE_PATTERN.test(key)) {
      params.delete(key);
    }
  }

  params.set('where[or][0][status][equals]', 'replied');
  params.set('where[or][1][status][equals]', 'closed');

  return buildCollectionHref(adminBase, params.toString());
}

export function buildFormSubmissionUnassignedHref(adminBase: string, search = '') {
  const params = new URLSearchParams(search);

  for (const key of Array.from(params.keys())) {
    if (key === 'page' || WORK_VIEW_CLAUSE_PATTERN.test(key)) {
      params.delete(key);
    }
  }

  params.set('where[assignedTo][exists]', 'false');

  return buildCollectionHref(adminBase, params.toString());
}

function buildSubmissionCountUrl(
  apiBase: string,
  params: Readonly<Record<string, string | undefined>>,
) {
  const query = new URLSearchParams({
    depth: '0',
    limit: '0',
  });

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  return `${normalizedBase(apiBase)}/${collectionSlug}?${query.toString()}`;
}

function statusValuesFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const values = new Set<string>();

  for (const [key, value] of params.entries()) {
    if (STATUS_CLAUSE_PATTERN.test(key) && key.endsWith('[equals]')) {
      values.add(value);
    }
  }

  return values;
}

function inquiryTypeFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const values = new Set<string>();

  for (const [key, value] of params.entries()) {
    if (INQUIRY_TYPE_CLAUSE_PATTERN.test(key) && key.endsWith('[equals]')) {
      values.add(value);
    }
  }

  return values.size === 1 ? (values.values().next().value as string) : '';
}

function hasUnassignedClause(search: string) {
  const params = new URLSearchParams(search);

  for (const [key, value] of params.entries()) {
    if (ASSIGNED_TO_CLAUSE_PATTERN.test(key) && key.endsWith('[exists]') && value === 'false') {
      return true;
    }
  }

  return false;
}

function activeWorkView(search: string): 'all' | 'archived' | 'priority' {
  const statuses = statusValuesFromSearch(search);

  if (statuses.has('replied') && statuses.has('closed')) {
    return 'archived';
  }

  if (statuses.has('new') || hasUnassignedClause(search)) {
    return 'priority';
  }

  return 'all';
}

async function fetchCount(url: string, signal?: AbortSignal) {
  const requestOptions: RequestInit = {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
    },
  };

  if (signal) {
    requestOptions.signal = signal;
  }

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    throw new Error(`Inquiry count request failed: ${response.status}`);
  }

  const data = (await response.json()) as CountResponse;

  return typeof data.totalDocs === 'number' ? data.totalDocs : 0;
}

function formatCount(count: number | undefined) {
  return typeof count === 'number' ? count : '...';
}

function tokenValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '[complex]';
}

function listDataRefreshKey(data?: ListDataRefreshSource) {
  if (!data) {
    return 'no-list-data';
  }

  const docKey = (data.docs ?? [])
    .map((doc) =>
      [
        tokenValue(doc.id),
        tokenValue(doc.updatedAt),
        tokenValue(doc.status),
        tokenValue(doc.assignedTo),
      ].join(':'),
    )
    .join('|');

  return [
    tokenValue(data.totalDocs),
    tokenValue(data.totalPages),
    tokenValue(data.page),
    tokenValue(data.limit),
    tokenValue(data.pagingCounter),
    docKey,
  ].join('::');
}

export function FormSubmissionsStatusTabs({ data }: FormSubmissionsStatusTabsProps = {}) {
  const t = useAdminText();
  const {
    config: { routes },
  } = useConfig();
  const [counts, setCounts] = useState<SubmissionCounts>({});
  const [failed, setFailed] = useState(false);
  const search = currentSearch();
  const activeView = activeWorkView(search);
  const activeInquiryType = inquiryTypeFromSearch(search);
  const allHref = buildFormSubmissionAllRecordsHref(routes.admin, search);
  const priorityHref = buildFormSubmissionPriorityHref(routes.admin, search);
  const archivedHref = buildFormSubmissionArchivedHref(routes.admin, search);
  const todayHref = buildFormSubmissionTodayHref(routes.admin, search);
  const unassignedHref = buildFormSubmissionUnassignedHref(routes.admin, search);
  const metricHrefs: Record<SubmissionCountKey, string> = {
    archived: archivedHref,
    priority: priorityHref,
    today: todayHref,
    unassigned: unassignedHref,
  };
  const workViews = [
    { href: priorityHref, key: 'priority', label: '优先处理' },
    { href: allHref, key: 'all', label: '全部记录' },
    { href: archivedHref, key: 'archived', label: '已完成' },
  ] as const;
  const countRequests = useMemo(
    () =>
      [
        [
          'priority',
          buildSubmissionCountUrl(routes.api, {
            'where[or][0][status][equals]': 'new',
            'where[or][1][assignedTo][exists]': 'false',
          }),
        ],
        [
          'unassigned',
          buildSubmissionCountUrl(routes.api, {
            'where[assignedTo][exists]': 'false',
          }),
        ],
        [
          'today',
          buildSubmissionCountUrl(routes.api, {
            'where[createdAt][greater_than_equal]': startOfTodayIso(),
          }),
        ],
        [
          'archived',
          buildSubmissionCountUrl(routes.api, {
            'where[or][0][status][equals]': 'replied',
            'where[or][1][status][equals]': 'closed',
          }),
        ],
      ] as const satisfies readonly (readonly [SubmissionCountKey, string])[],
    [routes.api],
  );
  const listRefreshKey = listDataRefreshKey(data);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCounts() {
      setFailed(false);

      const entries = await Promise.allSettled(
        countRequests.map(
          async ([key, url]) => [key, await fetchCount(url, controller.signal)] as const,
        ),
      );

      if (controller.signal.aborted) {
        return;
      }

      const nextCounts: SubmissionCounts = {};
      let hasFailed = false;

      for (const entry of entries) {
        if (entry.status === 'fulfilled') {
          const [key, count] = entry.value;

          nextCounts[key] = count;
        } else {
          hasFailed = true;
        }
      }

      setCounts(nextCounts);
      setFailed(hasFailed);
    }

    void loadCounts();

    return () => controller.abort();
  }, [countRequests, listRefreshKey]);

  return (
    <section className="yf-form-workbench" aria-label={t('咨询表单')}>
      <div className="yf-form-workbench__hero">
        <div>
          <h1>{t('咨询线索')}</h1>
          <p>{t('新留言优先跟进，处理完成后归档。')}</p>
        </div>
      </div>

      <div className="yf-form-workbench__metrics" aria-label={t('咨询摘要')}>
        {metricCards.map((metric) => (
          <a
            className={[
              'yf-form-workbench__metric',
              metric.accent === 'hot' ? 'yf-form-workbench__metric--hot' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            href={metricHrefs[metric.countKey]}
            key={metric.countKey}
          >
            <strong>{formatCount(counts[metric.countKey])}</strong>
            <span>{t(metric.label)}</span>
            <small>{t(metric.tone)}</small>
          </a>
        ))}
      </div>

      <section className="yf-form-workbench__controls" aria-label={t('咨询列表控制')}>
        <div className="yf-form-view-switch">
          <span>{t('工作视图')}</span>
          <nav className="yf-form-view-switch__nav" aria-label={t('工作视图')}>
            {workViews.map((view) => (
              <a
                aria-current={activeView === view.key ? 'page' : undefined}
                className={activeView === view.key ? 'is-active' : undefined}
                href={view.href}
                key={view.key}
              >
                {t(view.label)}
              </a>
            ))}
          </nav>
        </div>
        <div className="yf-form-quick-filters" aria-label={t('咨询快捷筛选')}>
          <span>{t('类型筛选')}</span>
          {quickFilters.map((filter) => {
            const value = filter.value ?? '';
            const isActive = activeInquiryType === value;

            return (
              <a
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'is-active' : undefined}
                href={buildFormSubmissionQuickFilterHref(routes.admin, filter.value, search)}
                key={t(filter.label)}
              >
                {t(filter.label)}
              </a>
            );
          })}
          <a href={buildFormSubmissionResetHref(routes.admin)}>{t('重置搜索')}</a>
        </div>
        {failed ? <span className="yf-form-workbench__notice">{t('部分数量暂不可用')}</span> : null}
      </section>
    </section>
  );
}

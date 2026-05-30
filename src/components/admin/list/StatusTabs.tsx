'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAdminText } from '../adminUiLocale';

export type StatusTabOption = Readonly<{
  label: string;
  value?: string;
}>;

type StatusTabsProps = Readonly<{
  adminBase: string;
  apiBase: string;
  collectionSlug: string;
  description?: string;
  options: readonly StatusTabOption[];
  title: string;
}>;

type CountResponse = Readonly<{
  totalDocs?: number;
}>;

function normalizedBase(path: string) {
  return path.replace(/\/$/, '');
}

function currentSearch() {
  return typeof window === 'undefined' ? '' : window.location.search;
}

const STATUS_CLAUSE_PATTERN = /^where(?:\[[^\]]+\])*\[status\]\[[a-z_]+\]$/;

function isStatusClauseKey(key: string) {
  return STATUS_CLAUSE_PATTERN.test(key);
}

export function statusFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const found = new Set<string>();

  for (const [key, value] of params.entries()) {
    if (isStatusClauseKey(key) && key.endsWith('[equals]')) {
      found.add(value);
    }
  }

  return found.size === 1 ? (found.values().next().value as string) : '';
}

export function buildStatusTabHref(
  adminBase: string,
  collectionSlug: string,
  status: string | undefined,
  search = '',
) {
  const params = new URLSearchParams(search);

  for (const key of Array.from(params.keys())) {
    if (key === 'page' || isStatusClauseKey(key)) {
      params.delete(key);
    }
  }

  if (status) {
    params.set('where[status][equals]', status);
  }

  const query = params.toString();

  return `${normalizedBase(adminBase)}/collections/${collectionSlug}${query ? `?${query}` : ''}`;
}

export function buildStatusCountUrl(
  apiBase: string,
  collectionSlug: string,
  status: string | undefined,
) {
  const params = new URLSearchParams({
    depth: '0',
    limit: '0',
  });

  if (status) {
    params.set('where[status][equals]', status);
  }

  return `${normalizedBase(apiBase)}/${collectionSlug}?${params.toString()}`;
}

async function fetchStatusCount(
  apiBase: string,
  collectionSlug: string,
  status: string | undefined,
) {
  const response = await fetch(buildStatusCountUrl(apiBase, collectionSlug, status), {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Status count request failed: ${response.status}`);
  }

  const data = (await response.json()) as CountResponse;

  return typeof data.totalDocs === 'number' ? data.totalDocs : 0;
}

export function StatusTabs({
  adminBase,
  apiBase,
  collectionSlug,
  description,
  options,
  title,
}: StatusTabsProps) {
  const t = useAdminText();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [failed, setFailed] = useState(false);
  const search = currentSearch();
  const activeStatus = statusFromSearch(search);
  const countKey = useMemo(
    () => options.map((option) => option.value ?? 'all').join('|'),
    [options],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadCounts() {
      setFailed(false);

      try {
        const entries = await Promise.all(
          options.map(async (option) => {
            const value = option.value ?? '';
            const count = await fetchStatusCount(apiBase, collectionSlug, value);

            return [value || 'all', count] as const;
          }),
        );

        if (!controller.signal.aborted) {
          setCounts(Object.fromEntries(entries));
        }
      } catch {
        if (!controller.signal.aborted) {
          setFailed(true);
        }
      }
    }

    void loadCounts();

    return () => controller.abort();
  }, [apiBase, collectionSlug, countKey, options]);

  return (
    <section className="yf-status-tabs" aria-label={t(title)}>
      <div className="yf-status-tabs__head">
        <div>
          <h2>{t(title)}</h2>
          {description ? <p>{t(description)}</p> : null}
        </div>
        {failed ? <span className="yf-status-tabs__notice">{t('数量暂不可用')}</span> : null}
      </div>
      <nav className="yf-status-tabs__nav" aria-label={t('状态筛选')}>
        {options.map((option) => {
          const value = option.value ?? '';
          const isActive = activeStatus === value;
          const count = counts[value || 'all'];

          return (
            <a
              aria-current={isActive ? 'page' : undefined}
              className={isActive ? 'is-active' : undefined}
              href={buildStatusTabHref(adminBase, collectionSlug, value, search)}
              key={value || 'all'}
            >
              <span>{t(option.label)}</span>
              {typeof count === 'number' ? <strong>{count}</strong> : null}
            </a>
          );
        })}
      </nav>
    </section>
  );
}

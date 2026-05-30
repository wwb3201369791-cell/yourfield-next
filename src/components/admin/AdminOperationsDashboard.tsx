'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAdminText } from './adminUiLocale';
import { DashboardReady } from './dashboard/DashboardReady';
import { fetchDashboardState } from './dashboard/fetch';
import { AdminOpsError } from './dashboard/sections/AdminOpsError';
import { AdminOpsSkeleton } from './dashboard/sections/AdminOpsSkeleton';
import { dashboardRangeOptions } from './dashboard/types';
import type {
  AdminOperationsDashboardProps,
  DashboardRangeDays,
  DashboardState,
  LoadState,
} from './dashboard/types';

export { dashboardRangeOptions } from './dashboard/types';
export {
  deriveSearchStats,
  displayableOperationalTopKeywords,
  isDisplayableOperationalSearchTerm,
} from './dashboard/deriveSearchStats';

const defaultRangeDays: DashboardRangeDays = dashboardRangeOptions[0].value;
const dashboardStateCache = new Map<string, DashboardState>();

function dashboardCacheKey(apiBase: string, rangeDays: DashboardRangeDays) {
  return `${apiBase}::${rangeDays}`;
}

function readDashboardCache(apiBase: string, rangeDays: DashboardRangeDays) {
  return dashboardStateCache.get(dashboardCacheKey(apiBase, rangeDays)) ?? null;
}

function writeDashboardCache(apiBase: string, rangeDays: DashboardRangeDays, data: DashboardState) {
  dashboardStateCache.set(dashboardCacheKey(apiBase, rangeDays), data);
}

function initialLoadState(apiBase: string): LoadState {
  const cachedData = readDashboardCache(apiBase, defaultRangeDays);

  return cachedData ? { data: cachedData, status: 'ready' } : { status: 'idle' };
}

export function AdminOperationsDashboard({ adminBase, apiBase }: AdminOperationsDashboardProps) {
  const t = useAdminText();
  const [state, setState] = useState<LoadState>(() => initialLoadState(apiBase));
  const [rangeDays, setRangeDays] = useState<DashboardRangeDays>(defaultRangeDays);
  const [refreshing, setRefreshing] = useState(false);
  const latestRequestId = useRef(0);
  const lastSuccessfulFetchAt = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const loadDashboard = useCallback(
    async (nextRangeDays: DashboardRangeDays, isRefresh = false) => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;
      const cachedData = readDashboardCache(apiBase, nextRangeDays);
      const canHydrateFromCache = cachedData !== null;

      if (canHydrateFromCache) {
        setState({ data: cachedData, status: 'ready' });
      }

      if (isRefresh || canHydrateFromCache) {
        setRefreshing(true);
      } else {
        setRefreshing(false);
        setState({ status: 'loading' });
      }

      try {
        const data = await fetchDashboardState(apiBase, nextRangeDays);
        writeDashboardCache(apiBase, nextRangeDays, data);

        if (!mounted.current || latestRequestId.current !== requestId) {
          return;
        }

        lastSuccessfulFetchAt.current = Date.now();
        setState({ data, status: 'ready' });
      } catch (error) {
        if (!mounted.current || latestRequestId.current !== requestId) {
          return;
        }

        if (canHydrateFromCache && !isRefresh) {
          setState({ data: cachedData, status: 'ready' });
          return;
        }

        setState({
          message: error instanceof Error ? error.message : t('未知错误'),
          status: 'error',
        });
      } finally {
        if (mounted.current && latestRequestId.current === requestId) {
          setRefreshing(false);
        }
      }
    },
    [apiBase, t],
  );

  const handleRangeChange = useCallback(
    (nextRangeDays: DashboardRangeDays) => {
      if (nextRangeDays === rangeDays) {
        return;
      }

      const cachedData = readDashboardCache(apiBase, nextRangeDays);

      setRangeDays(nextRangeDays);

      if (cachedData) {
        setState({ data: cachedData, status: 'ready' });
        setRefreshing(true);
      } else {
        setRefreshing(false);
        setState({ status: 'loading' });
      }
    },
    [apiBase, rangeDays],
  );

  useEffect(() => {
    void loadDashboard(rangeDays);
  }, [loadDashboard, rangeDays]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const minIntervalMs = 60_000;
    const handleFocus = () => {
      if (Date.now() - lastSuccessfulFetchAt.current < minIntervalMs) {
        return;
      }
      void loadDashboard(rangeDays, true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadDashboard, rangeDays]);

  switch (state.status) {
    case 'idle':
    case 'loading':
      return <AdminOpsSkeleton />;
    case 'error':
      return (
        <AdminOpsError message={state.message} onRetry={() => void loadDashboard(rangeDays)} />
      );
    case 'ready':
      return (
        <DashboardReady
          adminBase={adminBase}
          apiBase={apiBase}
          data={state.data}
          rangeDays={rangeDays}
          refreshing={refreshing}
          onRangeChange={handleRangeChange}
          onRefresh={() => void loadDashboard(rangeDays, true)}
        />
      );
  }
}

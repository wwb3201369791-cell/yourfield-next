'use client';

import { RefreshCw } from 'lucide-react';
import { useConfig } from 'payload/dist/admin/components/utilities/Config';
import React, { useCallback, useEffect, useState } from 'react';

import { DashboardHealthPanel } from './dashboard/sections/DashboardHealthPanel';
import type { DashboardHealthResponse } from './dashboard/types';

type HealthViewState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ data: DashboardHealthResponse; status: 'ready' }>
  | Readonly<{ message: string; status: 'error' }>;

async function fetchDashboardHealth(apiBase: string) {
  const response = await fetch(`${apiBase}/dashboard/health`, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`);
  }

  return (await response.json()) as DashboardHealthResponse;
}

export function AdminDashboardHealthView() {
  const { routes } = useConfig();
  const [state, setState] = useState<HealthViewState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const loadHealth = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setState({ status: 'loading' });
      }

      try {
        const data = await fetchDashboardHealth(routes.api);
        setState({ data, status: 'ready' });
      } catch (error) {
        setState({
          message: error instanceof Error ? error.message : '未知错误',
          status: 'error',
        });
      } finally {
        setRefreshing(false);
      }
    },
    [routes.api],
  );

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  return (
    <section className="yourfield-admin-health-page">
      <div className="yourfield-admin-health-page__head">
        <div>
          <p className="yourfield-ops-dashboard__eyebrow">运营体检</p>
          <h1>网站内容健康度</h1>
        </div>
        <button
          className="yourfield-ops-refresh"
          type="button"
          onClick={() => void loadHealth(true)}
          disabled={refreshing || state.status === 'loading'}
        >
          <RefreshCw aria-hidden="true" size={16} strokeWidth={2.2} />
          <span>{refreshing ? '更新中' : '刷新'}</span>
        </button>
      </div>

      {state.status === 'loading' ? (
        <div className="yourfield-ops-skeleton-grid" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="yourfield-ops-panel yourfield-admin-health-page__error">
          <h2>健康检查加载失败</h2>
          <p>{state.message}</p>
          <button className="yourfield-ops-refresh" type="button" onClick={() => void loadHealth()}>
            <RefreshCw aria-hidden="true" size={16} strokeWidth={2.2} />
            <span>重试</span>
          </button>
        </div>
      ) : null}

      {state.status === 'ready' ? (
        <DashboardHealthPanel adminBase={routes.admin} health={state.data} variant="detail" />
      ) : null}
    </section>
  );
}

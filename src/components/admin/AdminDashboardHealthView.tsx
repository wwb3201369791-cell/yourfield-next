'use client';

import { useConfig } from '@payloadcms/ui';
import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { asAdminInterfaceLocale } from './AdminInterfaceLanguageSwitch';
import { DashboardHealthPanel } from './dashboard/sections/DashboardHealthPanel';
import type { DashboardHealthResponse } from './dashboard/types';

type HealthViewState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ data: DashboardHealthResponse; status: 'ready' }>
  | Readonly<{ message: string; status: 'error' }>;

const healthViewCopy = {
  en: {
    eyebrow: 'Operations checkup',
    failedTitle: 'Health check failed to load',
    refresh: 'Refresh',
    refreshing: 'Refreshing',
    requestFailed: 'Request failed',
    retry: 'Retry',
    title: 'Website Content Health',
    unknownError: 'Unknown error',
  },
  zh: {
    eyebrow: '运营体检',
    failedTitle: '健康检查加载失败',
    refresh: '刷新',
    refreshing: '更新中',
    requestFailed: '请求失败',
    retry: '重试',
    title: '网站内容健康度',
    unknownError: '未知错误',
  },
} as const;

function useHealthViewCopy() {
  const { i18n } = useTranslation();

  return healthViewCopy[asAdminInterfaceLocale(i18n.language)];
}

async function fetchDashboardHealth(apiBase: string, requestFailedLabel: string) {
  const response = await fetch(`${apiBase}/dashboard/health`, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`${requestFailedLabel}: ${response.status}`);
  }

  return (await response.json()) as DashboardHealthResponse;
}

export function AdminDashboardHealthView() {
  const {
    config: { routes },
  } = useConfig();
  const copy = useHealthViewCopy();
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
        const data = await fetchDashboardHealth(routes.api, copy.requestFailed);
        setState({ data, status: 'ready' });
      } catch (error) {
        setState({
          message: error instanceof Error ? error.message : copy.unknownError,
          status: 'error',
        });
      } finally {
        setRefreshing(false);
      }
    },
    [copy.requestFailed, copy.unknownError, routes.api],
  );

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  return (
    <section className="yourfield-admin-health-page">
      <div className="yourfield-admin-health-page__head">
        <div>
          <p className="yourfield-ops-dashboard__eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
        </div>
        <button
          className="yourfield-ops-refresh"
          type="button"
          onClick={() => void loadHealth(true)}
          disabled={refreshing || state.status === 'loading'}
        >
          <RefreshCw aria-hidden="true" size={16} strokeWidth={2.2} />
          <span>{refreshing ? copy.refreshing : copy.refresh}</span>
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
          <h2>{copy.failedTitle}</h2>
          <p>{state.message}</p>
          <button className="yourfield-ops-refresh" type="button" onClick={() => void loadHealth()}>
            <RefreshCw aria-hidden="true" size={16} strokeWidth={2.2} />
            <span>{copy.retry}</span>
          </button>
        </div>
      ) : null}

      {state.status === 'ready' ? (
        <DashboardHealthPanel adminBase={routes.admin} health={state.data} variant="detail" />
      ) : null}
    </section>
  );
}

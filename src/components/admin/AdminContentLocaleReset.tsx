'use client';

import { useConfig } from '@payloadcms/ui';
import { useEffect } from 'react';

import { defaultAdminContentLocaleUrl } from './adminContentLocaleState';

const adminLocationChangeEvent = 'yourfield-admin-location-change';

let historyPatched = false;

function currentLocationParts() {
  return {
    hash: window.location.hash,
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

function dispatchAdminLocationChange() {
  window.dispatchEvent(new Event(adminLocationChangeEvent));
}

function patchHistoryEvents() {
  if (historyPatched || typeof window === 'undefined') {
    return;
  }

  const { history } = window;
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function pushState(...args) {
    const result = originalPushState(...args);
    dispatchAdminLocationChange();
    return result;
  };

  history.replaceState = function replaceState(...args) {
    const result = originalReplaceState(...args);
    dispatchAdminLocationChange();
    return result;
  };

  historyPatched = true;
}

export function AdminContentLocaleReset() {
  const {
    config: { routes },
  } = useConfig();

  useEffect(() => {
    patchHistoryEvents();

    const syncContentLocale = () => {
      const nextUrl = defaultAdminContentLocaleUrl(currentLocationParts(), {
        adminPath: routes.admin,
      });

      if (!nextUrl) {
        return;
      }

      window.location.replace(nextUrl);
    };

    syncContentLocale();
    window.addEventListener('popstate', syncContentLocale);
    window.addEventListener(adminLocationChangeEvent, syncContentLocale);

    return () => {
      window.removeEventListener('popstate', syncContentLocale);
      window.removeEventListener(adminLocationChangeEvent, syncContentLocale);
    };
  }, [routes.admin]);

  return null;
}

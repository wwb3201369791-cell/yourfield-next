'use client';

import { useAuth } from 'payload/dist/admin/components/utilities/Auth';
import { useLocale } from 'payload/dist/admin/components/utilities/Locale';
import { usePreferences } from 'payload/dist/admin/components/utilities/Preferences';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

const adminContentLocale = 'zh';

type AdminLocaleGuardProps = Readonly<{
  children: ReactNode;
}>;

function replaceAdminLocaleParam(nextLocale: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('locale', nextLocale);
  window.location.replace(url.toString());
}

export function AdminLocaleGuard({ children }: AdminLocaleGuardProps) {
  const { user } = useAuth();
  const locale = useLocale();
  const { setPreference } = usePreferences();

  useEffect(() => {
    if (!user) {
      return;
    }

    void setPreference('locale', adminContentLocale);
  }, [setPreference, user]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const requestedLocale = url.searchParams.get('locale');

    if (requestedLocale && requestedLocale !== adminContentLocale) {
      replaceAdminLocaleParam(adminContentLocale);
      return;
    }

    if (!requestedLocale && locale?.code && locale.code !== adminContentLocale) {
      replaceAdminLocaleParam(adminContentLocale);
    }
  }, [locale?.code]);

  return children;
}

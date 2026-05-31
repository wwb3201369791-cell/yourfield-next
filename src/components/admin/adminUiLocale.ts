'use client';

import { useTranslation } from '@payloadcms/ui';
import { useMemo } from 'react';

import {
  adminUiText,
  type AdminBilingualText,
  type AdminInterfaceLocale,
} from '@/lib/payload/adminText';

import { asAdminInterfaceLocale } from './AdminInterfaceLanguageSwitch';

export { adminUiText, type AdminBilingualText } from '@/lib/payload/adminText';

export function useAdminInterfaceLocale(): AdminInterfaceLocale {
  const { i18n } = useTranslation();

  return asAdminInterfaceLocale(i18n.language);
}

export function useAdminText() {
  const locale = useAdminInterfaceLocale();

  return useMemo(() => (value: AdminBilingualText) => adminUiText(locale, value), [locale]);
}

export function useAdminCopy<T extends Record<string, AdminBilingualText>>(copy: T) {
  const t = useAdminText();

  return useMemo(
    () =>
      Object.fromEntries(Object.entries(copy).map(([key, value]) => [key, t(value)])) as {
        [Key in keyof T]: string;
      },
    [copy, t],
  );
}

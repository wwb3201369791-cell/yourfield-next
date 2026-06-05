'use client';

import { useTranslation } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

const adminLanguageStorageKey = 'lng';
const payloadAdminLanguageCookieKey = 'payload-lng';
const adminInterfaceLocales = ['zh', 'en'] as const;

export type AdminInterfaceLocale = (typeof adminInterfaceLocales)[number];

type PayloadSwitchLanguage = ((locale: AdminInterfaceLocale) => void | Promise<void>) | undefined;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function localeFromCookie(cookieName: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));

  return cookie ? decodeURIComponent(cookie.slice(cookieName.length + 1)) : null;
}

export function asAdminInterfaceLocale(value: unknown): AdminInterfaceLocale {
  if (typeof value !== 'string') {
    return 'zh';
  }

  const normalized = value.toLowerCase();

  if (normalized.startsWith('en')) {
    return 'en';
  }

  return 'zh';
}

export function persistedAdminInterfaceLocale(): AdminInterfaceLocale | null {
  const storageValue = canUseStorage()
    ? window.localStorage.getItem(adminLanguageStorageKey)
    : null;
  const cookieValue =
    localeFromCookie(payloadAdminLanguageCookieKey) ?? localeFromCookie(adminLanguageStorageKey);
  const candidate = storageValue ?? cookieValue;

  return candidate === 'zh' || candidate === 'en' ? candidate : null;
}

export function persistAdminInterfaceLocale(locale: AdminInterfaceLocale) {
  if (canUseStorage()) {
    window.localStorage.setItem(adminLanguageStorageKey, locale);
  }

  if (typeof document !== 'undefined') {
    const cookieOptions = `max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    document.cookie = `${adminLanguageStorageKey}=${locale}; ${cookieOptions}`;
    document.cookie = `${payloadAdminLanguageCookieKey}=${locale}; ${cookieOptions}`;
    document.documentElement.lang = locale;
  }
}

function initialAdminInterfaceLocale(i18nLanguage: string | undefined) {
  return persistedAdminInterfaceLocale() ?? asAdminInterfaceLocale(i18nLanguage);
}

function syncPayloadAdminLanguage(
  nextLocale: AdminInterfaceLocale,
  i18nLanguage: string | undefined,
  switchLanguage: PayloadSwitchLanguage,
) {
  if (nextLocale === asAdminInterfaceLocale(i18nLanguage)) {
    return;
  }

  void switchLanguage?.(nextLocale);
}

function switchCopy(locale: AdminInterfaceLocale) {
  return locale === 'en'
    ? {
        ariaLabel: 'Switch admin interface language',
      }
    : {
        ariaLabel: '切换后台界面语言',
      };
}

export function AdminInterfaceLanguageSwitch() {
  const { i18n, switchLanguage } = useTranslation();
  const [currentLocale, setCurrentLocale] = useState<AdminInterfaceLocale>(() =>
    initialAdminInterfaceLocale(i18n.language),
  );
  const copy = switchCopy(currentLocale);

  useEffect(() => {
    const nextLocale = initialAdminInterfaceLocale(i18n.language);

    setCurrentLocale(nextLocale);
    syncPayloadAdminLanguage(nextLocale, i18n.language, switchLanguage);
  }, [i18n.language, switchLanguage]);

  const changeLocale = (nextLocale: AdminInterfaceLocale) => {
    if (nextLocale === currentLocale) {
      return;
    }

    persistAdminInterfaceLocale(nextLocale);
    setCurrentLocale(nextLocale);
    syncPayloadAdminLanguage(nextLocale, i18n.language, switchLanguage);
  };

  return (
    <div className="yourfield-admin-language-switch" aria-label={copy.ariaLabel}>
      <div className="yourfield-admin-language-switch__options" role="group">
        {adminInterfaceLocales.map((locale) => {
          const active = locale === currentLocale;
          const label = locale === 'zh' ? '中文' : 'EN';

          return (
            <button
              key={locale}
              aria-pressed={active}
              className={active ? 'is-active' : ''}
              type="button"
              onClick={() => changeLocale(locale)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

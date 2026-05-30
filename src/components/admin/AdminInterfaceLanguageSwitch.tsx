'use client';

import { useTranslation } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

const adminLanguageStorageKey = 'lng';
const adminInterfaceLocales = ['zh', 'en'] as const;

export type AdminInterfaceLocale = (typeof adminInterfaceLocales)[number];

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
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

export function persistAdminInterfaceLocale(locale: AdminInterfaceLocale) {
  if (canUseStorage()) {
    window.localStorage.setItem(adminLanguageStorageKey, locale);
  }

  if (typeof document !== 'undefined') {
    document.cookie = `${adminLanguageStorageKey}=${locale}; max-age=${
      60 * 60 * 24 * 365
    }; path=/; SameSite=Lax`;
  }
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
    asAdminInterfaceLocale(i18n.language),
  );
  const copy = switchCopy(currentLocale);

  useEffect(() => {
    setCurrentLocale(asAdminInterfaceLocale(i18n.language));
  }, [i18n.language]);

  const changeLocale = (nextLocale: AdminInterfaceLocale) => {
    if (nextLocale === currentLocale) {
      return;
    }

    persistAdminInterfaceLocale(nextLocale);
    setCurrentLocale(nextLocale);
    void switchLanguage?.(nextLocale);
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

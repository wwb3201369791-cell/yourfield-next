'use client';

import { useTranslation } from '@payloadcms/ui';
import { useEffect } from 'react';

import { asAdminInterfaceLocale } from './AdminInterfaceLanguageSwitch';
import { localizeAdminChromeRoot } from './adminNavLocalization';

const adminChromeRootSelector = [
  'aside',
  'header',
  'main',
  'nav',
  '[class*="collection" i]',
  '[class*="doc" i]',
  '[class*="global" i]',
  '[class*="sidebar" i]',
].join(',');

export function AdminNavLocalizationSync() {
  const { i18n } = useTranslation();
  const locale = asAdminInterfaceLocale(i18n.language);

  useEffect(() => {
    const localizeChrome = () => {
      const roots = Array.from(document.querySelectorAll(adminChromeRootSelector));

      for (const root of roots) {
        localizeAdminChromeRoot(root, locale);
      }
    };

    localizeChrome();

    const observer = new MutationObserver(() => localizeChrome());
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [locale]);

  return null;
}

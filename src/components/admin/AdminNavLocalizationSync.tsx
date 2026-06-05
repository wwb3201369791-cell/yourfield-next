'use client';

import { useTranslation } from '@payloadcms/ui';
import { useEffect } from 'react';

import { asAdminInterfaceLocale } from './AdminInterfaceLanguageSwitch';
import { localizeAdminChromeRoot, localizeAdminDocumentTitle } from './adminNavLocalization';

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
      const localizedTitle = localizeAdminDocumentTitle(document.title, locale);

      if (localizedTitle !== document.title) {
        document.title = localizedTitle;
      }

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

    const title = document.querySelector('title');

    if (title) {
      observer.observe(title, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, [locale]);

  return null;
}

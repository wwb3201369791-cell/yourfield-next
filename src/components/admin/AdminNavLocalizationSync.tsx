'use client';

import { useTranslation } from '@payloadcms/ui';
import { useEffect } from 'react';

import { asAdminInterfaceLocale } from './AdminInterfaceLanguageSwitch';
import { localizeAdminNavText } from './adminNavLocalization';

const navRootSelector = [
  'aside',
  'nav',
  '[class*="nav" i]',
  '[class*="sidebar" i]',
  '[class*="collection" i]',
].join(',');

function localizeElementAttributes(
  element: Element,
  locale: ReturnType<typeof asAdminInterfaceLocale>,
) {
  for (const attributeName of ['aria-label', 'title']) {
    const attributeValue = element.getAttribute(attributeName);

    if (!attributeValue) {
      continue;
    }

    const localizedValue = localizeAdminNavText(attributeValue, locale);

    if (localizedValue !== attributeValue) {
      element.setAttribute(attributeName, localizedValue);
    }
  }
}

export function localizeAdminNavRoot(
  root: ParentNode,
  locale: ReturnType<typeof asAdminInterfaceLocale>,
) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const node of textNodes) {
    const localizedValue = localizeAdminNavText(node.nodeValue ?? '', locale);

    if (localizedValue !== node.nodeValue) {
      node.nodeValue = localizedValue;
    }
  }

  if (root instanceof Element) {
    localizeElementAttributes(root, locale);
  }

  for (const element of Array.from(root.querySelectorAll('*'))) {
    localizeElementAttributes(element, locale);
  }
}

export function AdminNavLocalizationSync() {
  const { i18n } = useTranslation();
  const locale = asAdminInterfaceLocale(i18n.language);

  useEffect(() => {
    const localizeNavigation = () => {
      const roots = Array.from(document.querySelectorAll(navRootSelector));

      for (const root of roots) {
        localizeAdminNavRoot(root, locale);
      }
    };

    localizeNavigation();

    const observer = new MutationObserver(() => localizeNavigation());
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [locale]);

  return null;
}

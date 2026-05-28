import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { getTranslations } from '@/lib/i18n/getTranslations';
import type { Locale } from '@/lib/i18n/locale';
import {
  getFallbackNavigation,
  isContactNavigationHref,
  isExternalNavigationHref,
  type SiteFooterGroup,
  type SiteNavigation,
  type SiteNavigationItem,
} from '@/lib/navigation';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsGlobalCacheTag } from './cache';
import { getPayloadClient } from './payload';

type NavigationTarget = '_self' | '_blank';

type CmsNavigationItem = {
  children?: CmsNavigationItem[];
  href?: string;
  id?: string | number;
  label?: string;
  target?: string;
};

type CmsFooterGroup = {
  heading?: string;
  id?: string | number;
  items?: CmsNavigationItem[];
};

type CmsNavigationDoc = {
  footerNav?: CmsFooterGroup[];
  mainNav?: CmsNavigationItem[];
  mobileNav?: CmsNavigationItem[];
};

const mainNavigationPublicPaths = new Set([
  '/',
  '/about',
  '/products',
  '/solutions',
  '/news',
  '/franchise',
  '/contact',
]);

const footerNavigationPublicPaths = new Set([
  ...mainNavigationPublicPaths,
  '/privacy',
  '/cookies',
  '/terms',
]);

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function target(value: string | undefined): NavigationTarget {
  return value === '_blank' ? '_blank' : '_self';
}

function itemKey(prefix: string, index: number, item: CmsNavigationItem) {
  return item.id
    ? `${prefix}-${String(item.id)}`
    : `${prefix}-${index}-${asString(item.href, 'link')}`;
}

function internalPath(href: string) {
  if (isExternalNavigationHref(href) || href.startsWith('#')) {
    return null;
  }

  try {
    const pathname = new URL(href, 'https://yourfield.local').pathname;
    const withoutLocale = pathname.replace(/^\/(zh|en|ru)(?=\/|$)/, '');

    return withoutLocale || '/';
  } catch {
    return null;
  }
}

function isSupportedHref(href: string, allowedPaths: ReadonlySet<string>) {
  const path = internalPath(href);

  return path ? allowedPaths.has(path) : true;
}

export function isSupportedMainNavigationHref(href: string) {
  return isSupportedHref(href, mainNavigationPublicPaths);
}

export function isSupportedFooterNavigationHref(href: string) {
  return isSupportedHref(href, footerNavigationPublicPaths);
}

function mapNavigationItem(
  item: CmsNavigationItem,
  index: number,
  prefix: string,
  allowedPaths: ReadonlySet<string>,
): SiteNavigationItem | null {
  const href = asString(item.href);
  const label = asString(item.label);

  if (!href || !label || !isSupportedHref(href, allowedPaths)) {
    return null;
  }

  const children = (item.children ?? [])
    .map((child, childIndex) =>
      mapNavigationItem(child, childIndex, `${prefix}-${index}`, allowedPaths),
    )
    .filter((child): child is SiteNavigationItem => Boolean(child));

  return {
    key: itemKey(prefix, index, item),
    label,
    href,
    target: target(item.target),
    isContact: Boolean(isContactNavigationHref(href)),
    ...(children.length > 0 ? { children } : {}),
  };
}

function mapNavigationItems(
  items: readonly CmsNavigationItem[] | undefined,
  prefix: string,
  allowedPaths: ReadonlySet<string>,
): readonly SiteNavigationItem[] {
  return (items ?? [])
    .map((item, index) => mapNavigationItem(item, index, prefix, allowedPaths))
    .filter((item): item is SiteNavigationItem => Boolean(item));
}

function navigationPathKey(item: SiteNavigationItem) {
  return internalPath(item.href);
}

function withFallbackDropdownChildren(
  items: readonly SiteNavigationItem[],
  fallbackItems: readonly SiteNavigationItem[],
): readonly SiteNavigationItem[] {
  const fallbackByPath = new Map(
    fallbackItems
      .map((item) => {
        const path = navigationPathKey(item);

        return path ? [path, item] : null;
      })
      .filter((entry): entry is [string, SiteNavigationItem] => Boolean(entry)),
  );

  return items.map((item) => {
    const itemPath = navigationPathKey(item);
    const fallbackItem = fallbackByPath.get(itemPath ?? '');
    const fallbackChildren = fallbackItem?.children;

    if (itemPath === '/news') {
      return {
        key: item.key,
        label: item.label,
        href: item.href,
        target: item.target,
        isContact: item.isContact,
      };
    }

    if (!fallbackChildren || fallbackChildren.length === 0) {
      return item;
    }

    if (itemPath === '/products') {
      return {
        ...item,
        children: fallbackChildren,
      };
    }

    const children = item.children ?? [];

    if (children.length >= fallbackChildren.length) {
      return item;
    }

    return {
      ...item,
      children: fallbackChildren,
    };
  });
}

function mapFooterGroups(
  groups: readonly CmsFooterGroup[] | undefined,
): readonly SiteFooterGroup[] {
  return (groups ?? [])
    .map((group, index) => {
      const label = asString(group.heading);
      const links = mapNavigationItems(group.items, `footer-${index}`, footerNavigationPublicPaths);

      if (!label || links.length === 0) {
        return null;
      }

      return {
        key: group.id ? `footer-${String(group.id)}` : `footer-${index}-${label}`,
        label,
        links,
      };
    })
    .filter((group): group is SiteFooterGroup => Boolean(group));
}

async function getCmsNavigationUncached(locale: Locale): Promise<SiteNavigation> {
  const [payload, t] = await Promise.all([getPayloadClient(), getTranslations(locale)]);
  const fallback = getFallbackNavigation(t);
  const doc = (await payload.findGlobal({
    slug: 'navigation',
    depth: 2,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
  })) as CmsNavigationDoc | undefined;
  const mappedMainNav = mapNavigationItems(doc?.mainNav, 'main', mainNavigationPublicPaths);
  const mainNav = withFallbackDropdownChildren(mappedMainNav, fallback.mainNav);
  const mappedMobileNav = mapNavigationItems(doc?.mobileNav, 'mobile', mainNavigationPublicPaths);
  const mobileNav = withFallbackDropdownChildren(mappedMobileNav, fallback.mobileNav);
  const footerNav = mapFooterGroups(doc?.footerNav);

  return {
    mainNav: mainNav.length > 0 ? mainNav : fallback.mainNav,
    mobileNav: mobileNav.length > 0 ? mobileNav : mainNav.length > 0 ? mainNav : fallback.mobileNav,
    footerNav: footerNav.length > 0 ? footerNav : fallback.footerNav,
  };
}

const getCachedCmsNavigation = unstable_cache(getCmsNavigationUncached, ['cms-navigation'], {
  revalidate: CMS_CACHE_REVALIDATE_SECONDS,
  tags: [cmsGlobalCacheTag('navigation')],
});

export const getCmsNavigation = cache(getCachedCmsNavigation);

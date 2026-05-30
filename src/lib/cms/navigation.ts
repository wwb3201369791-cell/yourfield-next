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

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag, cmsGlobalCacheTag } from './cache';
import { getPayloadClient } from './payload';
import { getCmsSolutions, type CmsSolution } from './solutions';

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

const solutionNavigationLimit = 7;

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
const footerGroupPaths = new Map([
  ['/about', 'about'],
  ['/products', 'products'],
  ['/solutions', 'solutions'],
  ['/news', 'news'],
  ['/franchise', 'franchise'],
]);
const knownFooterGroupKeys = new Set([...footerGroupPaths.values(), 'legal']);
const legalFooterPaths = new Set(['/privacy', '/cookies', '/terms']);
const legacyFranchiseNavigationLabels = new Map([
  ['招商合作', '招商加盟'],
  ['Franchise', 'Franchise Partnership'],
  ['Франчайзинг', 'Партнерство'],
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

function normalizeNavigationLabel(href: string, label: string) {
  if (internalPath(href) !== '/franchise') {
    return label;
  }

  return legacyFranchiseNavigationLabels.get(label) ?? label;
}

function normalizeFooterGroupLabel(label: string, links: readonly SiteNavigationItem[]) {
  if (links.length === 0 || !links.every((link) => navigationPathKey(link) === '/franchise')) {
    return label;
  }

  return legacyFranchiseNavigationLabels.get(label) ?? label;
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
  const rawLabel = asString(item.label);

  if (!href || !rawLabel || !isSupportedHref(href, allowedPaths)) {
    return null;
  }

  const label = normalizeNavigationLabel(href, rawLabel);
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

function solutionNavItem(solution: CmsSolution, index: number): SiteNavigationItem {
  return {
    key: `solutions-${solution.id || index}`,
    label: solution.title,
    href: `/solutions#${solution.id}`,
    target: '_self',
    isContact: false,
  };
}

function allSolutionsNavItem(t: (key: string) => string): SiteNavigationItem {
  return {
    key: 'solutions-all',
    label: t('nav.allSolutions'),
    href: '/solutions',
    target: '_self',
    isContact: false,
  };
}

function buildSolutionNavigationLinks(
  solutions: readonly CmsSolution[],
  t: (key: string) => string,
): readonly SiteNavigationItem[] {
  const solutionLinks = [...solutions]
    .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
    .map(solutionNavItem);

  if (solutionLinks.length <= solutionNavigationLimit) {
    return solutionLinks;
  }

  return [...solutionLinks.slice(0, solutionNavigationLimit), allSolutionsNavItem(t)];
}

function withoutChildren(item: SiteNavigationItem): SiteNavigationItem {
  return {
    key: item.key,
    label: item.label,
    href: item.href,
    target: item.target,
    isContact: item.isContact,
  };
}

function withDynamicSolutionChildren(
  items: readonly SiteNavigationItem[],
  solutionLinks: readonly SiteNavigationItem[],
): readonly SiteNavigationItem[] {
  return items.map((item) => {
    if (navigationPathKey(item) !== '/solutions') {
      return item;
    }

    if (solutionLinks.length === 0) {
      return withoutChildren(item);
    }

    return {
      ...item,
      children: solutionLinks,
    };
  });
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
      const links = mapNavigationItems(group.items, `footer-${index}`, footerNavigationPublicPaths);
      const label = normalizeFooterGroupLabel(asString(group.heading), links);

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

function footerGroupKey(group: SiteFooterGroup) {
  if (knownFooterGroupKeys.has(group.key)) {
    return group.key;
  }

  const paths = [
    ...new Set(
      group.links
        .map((link) => navigationPathKey(link))
        .filter((path): path is string => Boolean(path)),
    ),
  ];

  if (paths.length > 0 && paths.every((path) => legalFooterPaths.has(path))) {
    return 'legal';
  }

  if (paths.length !== 1) {
    return null;
  }

  const [path] = paths;

  return path ? (footerGroupPaths.get(path) ?? null) : null;
}

function mergeFooterGroups(
  fallbackGroups: readonly SiteFooterGroup[],
  cmsGroups: readonly SiteFooterGroup[],
  solutionLinks: readonly SiteNavigationItem[],
): readonly SiteFooterGroup[] {
  const cmsGroupsByKey = new Map<string, SiteFooterGroup>();

  cmsGroups.forEach((group) => {
    const key = footerGroupKey(group);

    if (key && key !== 'solutions') {
      cmsGroupsByKey.set(key, group);
    }
  });

  return fallbackGroups.map((group) => {
    if (group.key === 'solutions') {
      return {
        ...group,
        links: solutionLinks,
      };
    }

    return cmsGroupsByKey.get(group.key) ?? group;
  });
}

async function getCmsNavigationUncached(locale: Locale): Promise<SiteNavigation> {
  const [payload, t, solutions] = await Promise.all([
    getPayloadClient(),
    getTranslations(locale),
    getCmsSolutions(locale),
  ]);
  const fallback = getFallbackNavigation(t);
  const solutionLinks = buildSolutionNavigationLinks(solutions, t);
  const fallbackMainNav = withDynamicSolutionChildren(fallback.mainNav, solutionLinks);
  const fallbackMobileNav = withDynamicSolutionChildren(fallback.mobileNav, solutionLinks);
  const doc = (await payload.findGlobal({
    slug: 'navigation',
    depth: 2,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
  })) as CmsNavigationDoc | undefined;
  const mappedMainNav = mapNavigationItems(doc?.mainNav, 'main', mainNavigationPublicPaths);
  const mainNav = withDynamicSolutionChildren(
    withFallbackDropdownChildren(mappedMainNav, fallback.mainNav),
    solutionLinks,
  );
  const mappedMobileNav = mapNavigationItems(doc?.mobileNav, 'mobile', mainNavigationPublicPaths);
  const mobileNav = withDynamicSolutionChildren(
    withFallbackDropdownChildren(mappedMobileNav, fallback.mobileNav),
    solutionLinks,
  );
  const footerNav = mergeFooterGroups(
    fallback.footerNav,
    mapFooterGroups(doc?.footerNav),
    solutionLinks,
  );

  return {
    mainNav: mainNav.length > 0 ? mainNav : fallbackMainNav,
    mobileNav: mobileNav.length > 0 ? mobileNav : mainNav.length > 0 ? mainNav : fallbackMobileNav,
    footerNav,
  };
}

const getCachedCmsNavigation = unstable_cache(getCmsNavigationUncached, ['cms-navigation'], {
  revalidate: CMS_CACHE_REVALIDATE_SECONDS,
  tags: [cmsGlobalCacheTag('navigation'), cmsCollectionCacheTag('solutions')],
});

export const getCmsNavigation = cache(getCachedCmsNavigation);

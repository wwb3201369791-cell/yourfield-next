import { env } from '@/lib/env';
import { getTranslations } from '@/lib/i18n/getTranslations';
import type { Locale } from '@/lib/i18n/locale';
import {
  isContactNavigationHref,
  isExternalNavigationHref,
  type SiteFooterGroup,
  type SiteNavigation,
  type SiteNavigationItem,
} from '@/lib/navigation';
import { unstableCacheOrPassThrough } from '@/lib/next-cache';
import { reactCacheOrPassThrough } from '@/lib/react-cache';

import { CMS_CACHE_REVALIDATE_SECONDS, cmsCollectionCacheTag, cmsGlobalCacheTag } from './cache';
import { getPayloadClient } from './payload';
import { getCmsProductGroups, type CmsProductGroup } from './products';
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

function productGroupNavItem(group: CmsProductGroup, index: number): SiteNavigationItem {
  return {
    key: `products-${group.id || index}`,
    label: group.title,
    href: `/products#${group.id}`,
    target: '_self',
    isContact: false,
  };
}

function buildProductGroupNavigationLinks(
  groups: readonly CmsProductGroup[],
): readonly SiteNavigationItem[] {
  return groups.map(productGroupNavItem);
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

function withDynamicProductGroupChildren(
  items: readonly SiteNavigationItem[],
  productGroupLinks: readonly SiteNavigationItem[],
): readonly SiteNavigationItem[] {
  if (productGroupLinks.length === 0) {
    return items;
  }

  return items.map((item) => {
    if (navigationPathKey(item) !== '/products') {
      return item;
    }

    return {
      ...item,
      children: productGroupLinks,
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
      const rawKey = group.id ? String(group.id) : '';

      if (!label || links.length === 0) {
        return null;
      }

      return {
        key: rawKey
          ? knownFooterGroupKeys.has(rawKey)
            ? rawKey
            : `footer-${rawKey}`
          : `footer-${index}-${label}`,
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

function withDynamicFooterLinks(
  groups: readonly SiteFooterGroup[],
  solutionLinks: readonly SiteNavigationItem[],
  productGroupLinks: readonly SiteNavigationItem[],
): readonly SiteFooterGroup[] {
  return groups.map((group) => {
    const key = footerGroupKey(group);

    if (key === 'products') {
      return {
        ...group,
        links: productGroupLinks,
      };
    }

    if (key === 'solutions') {
      return {
        ...group,
        links: solutionLinks,
      };
    }

    return group;
  });
}

async function getCmsNavigationUncached(locale: Locale): Promise<SiteNavigation> {
  const [payload, t, solutions, productGroups] = await Promise.all([
    getPayloadClient(),
    getTranslations(locale),
    getCmsSolutions(locale),
    getCmsProductGroups(locale),
  ]);
  const solutionLinks = buildSolutionNavigationLinks(solutions, t);
  const productGroupLinks = buildProductGroupNavigationLinks(productGroups);
  const doc = (await payload.findGlobal({
    slug: 'navigation',
    depth: 2,
    fallbackLocale: 'none',
    locale,
    overrideAccess: true,
  })) as CmsNavigationDoc | undefined;
  const mappedMainNav = mapNavigationItems(doc?.mainNav, 'main', mainNavigationPublicPaths);
  const mainNav = withDynamicSolutionChildren(
    withDynamicProductGroupChildren(mappedMainNav, productGroupLinks),
    solutionLinks,
  );
  const mappedMobileNav = mapNavigationItems(doc?.mobileNav, 'mobile', mainNavigationPublicPaths);
  const mobileNav = withDynamicSolutionChildren(
    withDynamicProductGroupChildren(mappedMobileNav, productGroupLinks),
    solutionLinks,
  );
  const footerNav = withDynamicFooterLinks(
    mapFooterGroups(doc?.footerNav),
    solutionLinks,
    productGroupLinks,
  );

  return {
    mainNav,
    mobileNav,
    footerNav,
  };
}

const getCachedCmsNavigation = unstableCacheOrPassThrough(
  getCmsNavigationUncached,
  ['cms-navigation'],
  {
    revalidate: CMS_CACHE_REVALIDATE_SECONDS,
    tags: [
      cmsGlobalCacheTag('navigation'),
      cmsCollectionCacheTag('solutions'),
      cmsCollectionCacheTag('product-groups'),
    ],
  },
);

function shouldBypassNavigationCache() {
  return env.NODE_ENV !== 'production' || !env.REVALIDATE_SECRET;
}

export const getCmsNavigation = reactCacheOrPassThrough(async (locale: Locale) =>
  shouldBypassNavigationCache() ? getCmsNavigationUncached(locale) : getCachedCmsNavigation(locale),
);

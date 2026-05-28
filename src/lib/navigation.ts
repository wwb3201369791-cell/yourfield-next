import type { Locale } from '@/lib/i18n/locale';

export type NavKey =
  | 'home'
  | 'about'
  | 'products'
  | 'solutions'
  | 'news'
  | 'franchise'
  | 'contact'
  | 'privacy'
  | 'cookies'
  | 'terms';

type NavigationTarget = '_self' | '_blank';

type FallbackNavigationItem = Readonly<{
  key: NavKey;
  labelKey: string;
  path: string;
  hash?: string;
  children?: readonly FallbackNavigationItem[];
}>;

type FallbackFooterGroup = Readonly<{
  key: string;
  labelKey: string;
  links: readonly FallbackNavigationItem[];
}>;

export type SiteNavigationItem = Readonly<{
  key: string;
  label: string;
  href: string;
  target: NavigationTarget;
  isContact: boolean;
  children?: readonly SiteNavigationItem[];
}>;

export type SiteFooterGroup = Readonly<{
  key: string;
  label: string;
  links: readonly SiteNavigationItem[];
}>;

export type SiteNavigation = Readonly<{
  mainNav: readonly SiteNavigationItem[];
  mobileNav: readonly SiteNavigationItem[];
  footerNav: readonly SiteFooterGroup[];
}>;

type NavigationTranslator = (key: string) => string;

const localePathPattern = /^\/(zh|en|ru)(?=\/|$)/;

const fallbackMainNavigation: readonly FallbackNavigationItem[] = [
  {
    key: 'home',
    labelKey: 'nav.home',
    path: '/',
  },
  {
    key: 'about',
    labelKey: 'nav.about',
    path: '/about',
    children: [
      { key: 'about', labelKey: 'nav.companyProfile', path: '/about', hash: 'company-profile' },
      { key: 'about', labelKey: 'nav.culture', path: '/about', hash: 'culture' },
      { key: 'about', labelKey: 'nav.honors', path: '/about', hash: 'honors' },
      { key: 'about', labelKey: 'nav.history', path: '/about', hash: 'history' },
      {
        key: 'about',
        labelKey: 'nav.strategicPartners',
        path: '/about',
        hash: 'strategic-partners',
      },
      { key: 'about', labelKey: 'nav.video', path: '/about', hash: 'video' },
      { key: 'contact', labelKey: 'nav.contactUs', path: '/contact' },
    ],
  },
  {
    key: 'products',
    labelKey: 'nav.products',
    path: '/products',
    children: [
      {
        key: 'products',
        labelKey: 'product.group.fireRescue',
        path: '/products',
        hash: 'fire-rescue',
      },
      {
        key: 'products',
        labelKey: 'product.group.electrical',
        path: '/products',
        hash: 'electrical-protection',
      },
      {
        key: 'products',
        labelKey: 'product.group.thermal',
        path: '/products',
        hash: 'thermal-welding',
      },
      {
        key: 'products',
        labelKey: 'product.group.chemicalMedical',
        path: '/products',
        hash: 'chemical-medical',
      },
      {
        key: 'products',
        labelKey: 'product.group.waterRescue',
        path: '/products',
        hash: 'water-rescue',
      },
    ],
  },
  {
    key: 'solutions',
    labelKey: 'nav.solutions',
    path: '/solutions',
    children: [
      {
        key: 'solutions',
        labelKey: 'page.solutions.powerTitle',
        path: '/solutions',
        hash: 'power-energy',
      },
      {
        key: 'solutions',
        labelKey: 'page.solutions.petroTitle',
        path: '/solutions',
        hash: 'petrochemical',
      },
      {
        key: 'solutions',
        labelKey: 'page.solutions.manufacturingTitle',
        path: '/solutions',
        hash: 'manufacturing',
      },
      {
        key: 'solutions',
        labelKey: 'page.solutions.emergencyTitle',
        path: '/solutions',
        hash: 'emergency-response',
      },
    ],
  },
  {
    key: 'news',
    labelKey: 'nav.news',
    path: '/news',
  },
  {
    key: 'franchise',
    labelKey: 'nav.franchise',
    path: '/franchise',
  },
  {
    key: 'contact',
    labelKey: 'nav.contact',
    path: '/contact',
  },
];

const fallbackFooterGroups: readonly FallbackFooterGroup[] = [
  {
    key: 'about',
    labelKey: 'nav.about',
    links: [
      { key: 'about', labelKey: 'nav.companyProfile', path: '/about', hash: 'company-profile' },
      { key: 'about', labelKey: 'nav.culture', path: '/about', hash: 'culture' },
      { key: 'about', labelKey: 'nav.honors', path: '/about', hash: 'honors' },
      { key: 'about', labelKey: 'nav.history', path: '/about', hash: 'history' },
      {
        key: 'about',
        labelKey: 'nav.strategicPartners',
        path: '/about',
        hash: 'strategic-partners',
      },
      { key: 'about', labelKey: 'nav.video', path: '/about', hash: 'video' },
    ],
  },
  {
    key: 'products',
    labelKey: 'nav.products',
    links: [
      {
        key: 'products',
        labelKey: 'product.group.fireRescue',
        path: '/products',
        hash: 'fire-rescue',
      },
      {
        key: 'products',
        labelKey: 'product.group.electrical',
        path: '/products',
        hash: 'electrical-protection',
      },
      {
        key: 'products',
        labelKey: 'product.group.thermal',
        path: '/products',
        hash: 'thermal-welding',
      },
      {
        key: 'products',
        labelKey: 'product.group.chemicalMedical',
        path: '/products',
        hash: 'chemical-medical',
      },
      {
        key: 'products',
        labelKey: 'product.group.waterRescue',
        path: '/products',
        hash: 'water-rescue',
      },
    ],
  },
  {
    key: 'solutions',
    labelKey: 'nav.solutions',
    links: [
      {
        key: 'solutions',
        labelKey: 'page.solutions.powerTitle',
        path: '/solutions',
        hash: 'power-energy',
      },
      {
        key: 'solutions',
        labelKey: 'page.solutions.petroTitle',
        path: '/solutions',
        hash: 'petrochemical',
      },
      {
        key: 'solutions',
        labelKey: 'page.solutions.manufacturingTitle',
        path: '/solutions',
        hash: 'manufacturing',
      },
      {
        key: 'solutions',
        labelKey: 'page.solutions.emergencyTitle',
        path: '/solutions',
        hash: 'emergency-response',
      },
    ],
  },
  {
    key: 'news',
    labelKey: 'nav.news',
    links: [],
  },
  {
    key: 'franchise',
    labelKey: 'nav.franchise',
    links: [
      { key: 'franchise', labelKey: 'nav.franchise', path: '/franchise' },
      {
        key: 'franchise',
        labelKey: 'page.franchise.valueTag',
        path: '/franchise',
        hash: 'franchise-value',
      },
      {
        key: 'franchise',
        labelKey: 'page.franchise.targetTag',
        path: '/franchise',
        hash: 'franchise-targets',
      },
      {
        key: 'franchise',
        labelKey: 'page.franchise.policyTag',
        path: '/franchise',
        hash: 'franchise-policy',
      },
      {
        key: 'franchise',
        labelKey: 'page.franchise.supportTag',
        path: '/franchise',
        hash: 'franchise-support',
      },
      {
        key: 'franchise',
        labelKey: 'page.franchise.formTitle',
        path: '/franchise',
        hash: 'franchise-inquiry',
      },
    ],
  },
  {
    key: 'legal',
    labelKey: 'page.compliance.statusTitle',
    links: [
      { key: 'privacy', labelKey: 'page.compliance.privacy.title', path: '/privacy' },
      { key: 'cookies', labelKey: 'page.compliance.cookies.title', path: '/cookies' },
      { key: 'terms', labelKey: 'page.compliance.terms.title', path: '/terms' },
    ],
  },
];

function fallbackHref(item: Pick<FallbackNavigationItem, 'path' | 'hash'>) {
  return item.hash ? `${item.path}#${item.hash}` : item.path;
}

function fallbackItemToSiteItem(
  item: FallbackNavigationItem,
  t: NavigationTranslator,
  keyPrefix: string = item.key,
): SiteNavigationItem {
  const children = item.children?.map((child, index) =>
    fallbackItemToSiteItem(child, t, `${keyPrefix}-${index}`),
  );
  const href = fallbackHref(item);

  return {
    key: keyPrefix,
    label: t(item.labelKey),
    href,
    target: '_self',
    isContact: isContactNavigationHref(href),
    ...(children && children.length > 0 ? { children } : {}),
  };
}

export function getFallbackNavigation(t: NavigationTranslator): SiteNavigation {
  const mainNav = fallbackMainNavigation.map((item) => fallbackItemToSiteItem(item, t));

  return {
    mainNav,
    mobileNav: mainNav,
    footerNav: fallbackFooterGroups.map((group) => ({
      key: group.key,
      label: t(group.labelKey),
      links: group.links.map((item, index) =>
        fallbackItemToSiteItem(item, t, `${group.key}-${index}`),
      ),
    })),
  };
}

export function isExternalNavigationHref(href: string) {
  return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(href) || /^[a-z][a-z\d+.-]*:/i.test(href);
}

export function localizeNavigationHref(locale: Locale, href: string) {
  const cleanHref = href.trim() || '/';

  if (isExternalNavigationHref(cleanHref)) {
    return cleanHref;
  }

  if (cleanHref.startsWith('#')) {
    return `/${locale}${cleanHref}`;
  }

  if (localePathPattern.test(cleanHref)) {
    return cleanHref;
  }

  if (cleanHref === '/') {
    return `/${locale}`;
  }

  return cleanHref.startsWith('/') ? `/${locale}${cleanHref}` : cleanHref;
}

function getLocalizedPathname(locale: Locale, href: string) {
  if (isExternalNavigationHref(href)) {
    return null;
  }

  try {
    return new URL(localizeNavigationHref(locale, href), 'https://yourfield.local').pathname;
  } catch {
    return null;
  }
}

export function isContactNavigationHref(href: string) {
  const pathname = getLocalizedPathname('zh', href);
  const pathWithoutLocale = pathname?.replace(localePathPattern, '') || pathname;

  return pathWithoutLocale === '/contact' || Boolean(pathWithoutLocale?.startsWith('/contact/'));
}

export function getActiveNavigationKey(
  pathname: string,
  locale: Locale,
  items: readonly SiteNavigationItem[],
) {
  const localeRoot = `/${locale}`;

  for (const item of items) {
    const itemPathname = getLocalizedPathname(locale, item.href);

    if (!itemPathname) {
      continue;
    }

    if (itemPathname === localeRoot) {
      if (pathname === localeRoot || pathname === `${localeRoot}/`) {
        return item.key;
      }

      continue;
    }

    if (pathname === itemPathname || pathname.startsWith(`${itemPathname}/`)) {
      return item.key;
    }
  }

  return items[0]?.key ?? 'home';
}

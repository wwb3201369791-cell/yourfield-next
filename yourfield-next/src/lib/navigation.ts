import type { Locale } from '@/lib/i18n/locale';

export type NavKey = 'home' | 'about' | 'products' | 'solutions' | 'news' | 'franchise' | 'contact';

export type NavigationItem = Readonly<{
  key: NavKey;
  labelKey: string;
  path: string;
  hash?: string;
  isContact?: boolean;
  children?: readonly NavigationItem[];
}>;

export type FooterGroup = Readonly<{
  key: string;
  labelKey: string;
  links: readonly NavigationItem[];
}>;

export const mainNavigation: readonly NavigationItem[] = [
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
      { key: 'products', labelKey: 'nav.allProducts', path: '/products' },
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
    children: [
      { key: 'news', labelKey: 'nav.companyNews', path: '/news', hash: 'company-news' },
      { key: 'news', labelKey: 'nav.events', path: '/news', hash: 'events' },
    ],
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
    isContact: true,
  },
];

export const footerGroups: readonly FooterGroup[] = [
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
      { key: 'products', labelKey: 'nav.allProducts', path: '/products' },
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
    links: [
      { key: 'news', labelKey: 'nav.companyNews', path: '/news', hash: 'company-news' },
      { key: 'news', labelKey: 'nav.events', path: '/news', hash: 'events' },
      { key: 'news', labelKey: 'page.news.partnersTag', path: '/news', hash: 'partner-network' },
    ],
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
];

const activePathMap: readonly [string, NavKey][] = [
  ['/about', 'about'],
  ['/products', 'products'],
  ['/categories', 'products'],
  ['/solutions', 'solutions'],
  ['/news', 'news'],
  ['/franchise', 'franchise'],
  ['/contact', 'contact'],
];

export function localizeHref(locale: Locale, item: Pick<NavigationItem, 'path' | 'hash'>) {
  const localizedPath = item.path === '/' ? `/${locale}` : `/${locale}${item.path}`;
  return item.hash ? `${localizedPath}#${item.hash}` : localizedPath;
}

export function getActiveNavKey(pathname: string, locale: Locale): NavKey {
  const localePrefix = `/${locale}`;
  const pathWithoutLocale =
    pathname === localePrefix
      ? '/'
      : pathname.startsWith(`${localePrefix}/`)
        ? pathname.slice(localePrefix.length)
        : pathname;

  if (pathWithoutLocale === '/' || pathWithoutLocale === '') {
    return 'home';
  }

  return activePathMap.find(([path]) => pathWithoutLocale.startsWith(path))?.[1] ?? 'home';
}

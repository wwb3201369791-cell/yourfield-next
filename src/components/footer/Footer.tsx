import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { shouldUseUnoptimizedImage } from '@/lib/cms/media';
import { getCmsSiteSettings, type CmsSiteSettings } from '@/lib/cms/site-settings';
import { getTranslations } from '@/lib/i18n/getTranslations';
import type { Locale } from '@/lib/i18n/locale';
import {
  getFallbackNavigation,
  isExternalNavigationHref,
  localizeNavigationHref,
  type SiteFooterGroup,
  type SiteNavigationItem,
} from '@/lib/navigation';

type FooterProps = Readonly<{
  footerNavigation?: readonly SiteFooterGroup[];
  locale: Locale;
  siteSettings?: CmsSiteSettings;
}>;

function linkRel(item: SiteNavigationItem) {
  return item.target === '_blank' ? 'noopener noreferrer' : undefined;
}

const legalFooterHrefs = new Set(['/privacy', '/cookies', '/terms']);

function normalizeFooterHref(href: string) {
  const [pathWithoutHash] = href.trim().split('#');
  const [pathWithoutQuery] = (pathWithoutHash || '/').split('?');

  return (pathWithoutQuery || '/').replace(/^\/(?:zh|en|ru)(?=\/|$)/, '') || '/';
}

const productFooterGroupIds = new Set([
  'fire-rescue',
  'electrical-protection',
  'thermal-welding',
  'chemical-medical',
  'water-rescue',
]);

const footerGroupTitleHrefs: Readonly<Record<string, string>> = {
  about: '/about',
  franchise: '/franchise',
  news: '/news',
  products: '/products',
  solutions: '/solutions',
};

const footerGroupTitlePaths = new Set(Object.values(footerGroupTitleHrefs));

function internalFooterUrlFromHref(href: string) {
  if (isExternalNavigationHref(href)) {
    return null;
  }

  try {
    return new URL(href.trim(), 'https://yourfield.local');
  } catch {
    return null;
  }
}

function hasFooterQueryOrHash(href: string) {
  const url = internalFooterUrlFromHref(href);

  return Boolean(url?.search || url?.hash);
}

function getProductGroupFromHref(href: string) {
  const url = internalFooterUrlFromHref(href);

  if (!url) {
    return null;
  }

  const pathname = url.pathname.replace(/^\/(?:zh|en|ru)(?=\/|$)/, '') || '/';

  if (pathname !== '/products') {
    return null;
  }

  const group = url.searchParams.get('group')?.trim();

  return group && productFooterGroupIds.has(group) ? group : null;
}

function normalizeProductFooterLink(link: SiteNavigationItem): SiteNavigationItem {
  const group = getProductGroupFromHref(link.href);

  if (!group) {
    return link;
  }

  return {
    ...link,
    href: `/products#${group}`,
  };
}

function isTopLevelProductsLink(link: SiteNavigationItem) {
  return normalizeFooterHref(link.href) === '/products' && !hasFooterQueryOrHash(link.href);
}

function getFooterGroupTitleHref(group: SiteFooterGroup) {
  const knownHref = footerGroupTitleHrefs[group.key];

  if (knownHref) {
    return knownHref;
  }

  const firstLinkPath = normalizeFooterHref(group.links[0]?.href ?? '');

  return footerGroupTitlePaths.has(firstLinkPath) &&
    group.links.every((link) => normalizeFooterHref(link.href) === firstLinkPath)
    ? firstLinkPath
    : null;
}

function prepareFooterGroup(group: SiteFooterGroup) {
  const isProductsGroup = group.links.some(
    (link) => normalizeFooterHref(link.href) === '/products',
  );
  const isNewsGroup = group.links.some((link) => normalizeFooterHref(link.href) === '/news');

  if (isNewsGroup) {
    return {
      group: {
        ...group,
        links: [],
      },
      isProductsGroup: false,
    };
  }

  if (!isProductsGroup) {
    return { group, isProductsGroup };
  }

  return {
    group: {
      ...group,
      links: group.links
        .filter((link) => !isTopLevelProductsLink(link))
        .map(normalizeProductFooterLink),
    },
    isProductsGroup,
  };
}

function isLegalFooterGroup(group: SiteFooterGroup) {
  return (
    group.links.length > 0 &&
    group.links.every((link) => legalFooterHrefs.has(normalizeFooterHref(link.href)))
  );
}

function NavigationLink({
  children,
  item,
  locale,
}: Readonly<{
  children: ReactNode;
  item: SiteNavigationItem;
  locale: Locale;
}>) {
  const href = localizeNavigationHref(locale, item.href);

  if (isExternalNavigationHref(href)) {
    return (
      <a href={href} rel={linkRel(item)} target={item.target}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} rel={linkRel(item)} target={item.target}>
      {children}
    </Link>
  );
}

function FooterTitleLink({
  children,
  href,
  locale,
}: Readonly<{
  children: ReactNode;
  href: string;
  locale: Locale;
}>) {
  const localizedHref = localizeNavigationHref(locale, href);

  return (
    <Link className="footer-heading-link" href={localizedHref}>
      {children}
    </Link>
  );
}

export async function Footer({ footerNavigation, locale, siteSettings }: FooterProps) {
  const t = await getTranslations(locale);
  const [fallbackNavigation, resolvedSiteSettings] = await Promise.all([
    Promise.resolve(getFallbackNavigation(t)),
    siteSettings ? Promise.resolve(siteSettings) : getCmsSiteSettings(locale),
  ]);
  const fallbackFooterNavigation = fallbackNavigation.footerNav.filter(
    (group) => !isLegalFooterGroup(group),
  );
  const visibleCmsFooterNavigation = (footerNavigation ?? []).filter(
    (group) => !isLegalFooterGroup(group),
  );
  const resolvedFooterNavigation =
    visibleCmsFooterNavigation.length >= fallbackFooterNavigation.length
      ? visibleCmsFooterNavigation
      : fallbackFooterNavigation;
  const logo = resolvedSiteSettings.logoDark;

  return (
    <footer className="footer" id="site-footer" data-component-root="footer">
      <div className="container">
        <div className="footer-sitemap" aria-label={t('footer.contentLabel')}>
          <div className="footer-brand">
            <Link href={`/${locale}`} className="logo footer-logo" aria-label={t('nav.home')}>
              <Image
                className="logo-image"
                src={logo.src}
                alt=""
                width={logo.width}
                height={logo.height}
                aria-hidden="true"
                unoptimized={shouldUseUnoptimizedImage(logo.src)}
              />
            </Link>
            <p>{resolvedSiteSettings.tagline || t('footer.brand')}</p>
            <ul className="footer-proof-list">
              <li>{t('footer.since')}</li>
              <li>{t('footer.globalManufacturing')}</li>
            </ul>
          </div>

          {resolvedFooterNavigation.map((group) => {
            const titleHref = getFooterGroupTitleHref(group);
            const { group: displayGroup, isProductsGroup } = prepareFooterGroup(group);

            return (
              <nav
                key={displayGroup.key}
                className={isProductsGroup ? 'footer-links footer-products-nav' : 'footer-links'}
                aria-labelledby={`footer-${displayGroup.key}-title`}
              >
                <h4 id={`footer-${displayGroup.key}-title`}>
                  {titleHref ? (
                    <FooterTitleLink href={titleHref} locale={locale}>
                      {displayGroup.label}
                    </FooterTitleLink>
                  ) : (
                    displayGroup.label
                  )}
                </h4>
                {displayGroup.links.length > 0 ? (
                  <ul className={isProductsGroup ? 'footer-product-links' : undefined}>
                    {displayGroup.links.map((link) => (
                      <li key={link.key}>
                        <NavigationLink item={link} locale={locale}>
                          {link.label}
                        </NavigationLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </nav>
            );
          })}

          <div className="footer-contact-card" aria-labelledby="footer-contact-title">
            <h4 id="footer-contact-title">
              <FooterTitleLink href="/contact" locale={locale}>
                {t('nav.contact')}
              </FooterTitleLink>
            </h4>
            <address>
              <Link href={`/${locale}/contact#contact-info`}>
                {resolvedSiteSettings.contact.address || t('footer.address')}
              </Link>
              <a href={resolvedSiteSettings.contact.phoneHref}>
                {resolvedSiteSettings.contact.phone || t('footer.phone')}
              </a>
              <a href={resolvedSiteSettings.contact.emailHref}>
                {resolvedSiteSettings.contact.email || t('footer.email')}
              </a>
            </address>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}

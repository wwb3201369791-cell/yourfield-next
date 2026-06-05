'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react';

import { LanguageSwitcher } from '@/components/header/LanguageSwitcher';
import { SearchTrigger } from '@/components/header/SearchTrigger';
import { shouldUseUnoptimizedImage } from '@/lib/cms/media';
import type { CmsSiteSettings } from '@/lib/cms/site-settings';
import type { Locale } from '@/lib/i18n/locale';
import { useTranslations } from '@/lib/i18n/useTranslations';
import {
  getActiveNavigationKey,
  isExternalNavigationHref,
  localizeNavigationHref,
  type SiteNavigationItem,
} from '@/lib/navigation';

type HeaderProps = Readonly<{
  hotTerms?: readonly string[];
  locale: Locale;
  navigation?: readonly SiteNavigationItem[];
  siteSettings?: Pick<CmsSiteSettings, 'logoDark' | 'logoLight' | 'siteName'>;
}>;

const warmedNavigationHrefs = new Set<string>();
const suppressedDropdownBodyClass = 'is-nav-dropdown-suppressed';

function shouldWarmNavigationOnIntent() {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname.toLowerCase();

  return hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1';
}

function normalizedInternalNavigationHref(href: string) {
  if (isExternalNavigationHref(href)) {
    return null;
  }

  try {
    const url = new URL(href, window.location.origin);

    if (url.origin !== window.location.origin) {
      return null;
    }

    url.hash = '';

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function warmInternalNavigationHref(href: string, prefetch: (prefetchHref: string) => void) {
  if (!shouldWarmNavigationOnIntent()) {
    return;
  }

  const prefetchHref = normalizedInternalNavigationHref(href);

  if (!prefetchHref || warmedNavigationHrefs.has(prefetchHref)) {
    return;
  }

  warmedNavigationHrefs.add(prefetchHref);
  prefetch(prefetchHref);
}

function navigationPathname(href: string) {
  try {
    return new URL(href, 'https://yourfield.local').pathname;
  } catch {
    return href.split(/[?#]/)[0] || '/';
  }
}

function linkRel(item: SiteNavigationItem) {
  return item.target === '_blank' ? 'noopener noreferrer' : undefined;
}

function NavigationLink({
  ariaCurrent,
  children,
  className,
  dataNav,
  item,
  locale,
  onClick,
  onNavigateStart,
  pathname,
}: Readonly<{
  ariaCurrent?: 'page' | undefined;
  children: ReactNode;
  className?: string | undefined;
  dataNav?: string | undefined;
  item: SiteNavigationItem;
  locale: Locale;
  onClick?: ((event: MouseEvent<HTMLAnchorElement>) => void) | undefined;
  onNavigateStart?: (() => void) | undefined;
  pathname: string;
}>) {
  const router = useRouter();
  const href = localizeNavigationHref(locale, item.href);
  const rel = linkRel(item);
  const optionalProps = {
    ...(ariaCurrent ? { 'aria-current': ariaCurrent } : {}),
    ...(className ? { className } : {}),
    ...(dataNav ? { 'data-nav': dataNav } : {}),
    ...(rel ? { rel } : {}),
  };
  const isExternal = isExternalNavigationHref(href);

  function prefetchLink() {
    if (!isExternal && item.target !== '_blank') {
      warmInternalNavigationHref(href, (prefetchHref) => router.prefetch(prefetchHref));
    }
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      isExternal ||
      item.target === '_blank' ||
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    prefetchLink();

    if (navigationPathname(href) !== pathname) {
      onNavigateStart?.();
    }
  }

  if (isExternal) {
    return (
      <a {...optionalProps} href={href} target={item.target} onClick={handleClick}>
        {children}
      </a>
    );
  }

  return (
    <Link
      {...optionalProps}
      href={href}
      prefetch={false}
      target={item.target}
      onClick={handleClick}
      onFocus={prefetchLink}
      onMouseEnter={prefetchLink}
      onPointerDown={prefetchLink}
    >
      {children}
    </Link>
  );
}

function resolveHeaderNavigation(navigation: readonly SiteNavigationItem[] | undefined) {
  return navigation ?? [];
}

export function Header({ hotTerms = [], locale, navigation, siteSettings }: HeaderProps) {
  const t = useTranslations();
  const pathname = usePathname() ?? `/${locale}`;
  const resolvedNavigation = resolveHeaderNavigation(navigation);
  const activeKey = getActiveNavigationKey(pathname, locale, resolvedNavigation);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(() => new Set());
  const [desktopDropdownKey, setDesktopDropdownKey] = useState<string | null>(null);
  const [isRoutePending, setIsRoutePending] = useState(false);
  const [suppressedDropdownKey, setSuppressedDropdownKey] = useState<string | null>(null);
  const logoLight = siteSettings?.logoLight ?? null;
  const logoDark = siteSettings?.logoDark ?? null;
  const [hasLightLogoError, setHasLightLogoError] = useState(false);
  const [hasDarkLogoError, setHasDarkLogoError] = useState(false);
  const displayedLogoLight = hasLightLogoError ? null : logoLight;
  const displayedLogoDark = hasDarkLogoError ? null : logoDark;
  const displayedHeaderLogo = displayedLogoDark ?? displayedLogoLight;
  const isDisplayedHeaderLogoDark = Boolean(displayedLogoDark);
  const shouldShowTextLogo =
    !displayedLogoLight && !displayedLogoDark && Boolean(siteSettings?.siteName);

  useEffect(() => {
    setHasLightLogoError(false);
  }, [logoLight?.src]);

  useEffect(() => {
    setHasDarkLogoError(false);
  }, [logoDark?.src]);

  useEffect(() => {
    setIsMenuOpen(false);
    setOpenDropdowns(new Set());
    setIsRoutePending(false);
  }, [pathname]);

  useEffect(() => {
    if (!isRoutePending) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsRoutePending(false);
    }, 6000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isRoutePending]);

  useEffect(() => {
    document.body.classList.toggle('is-nav-open', isMenuOpen);

    return () => {
      document.body.classList.remove('is-nav-open');
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const clearSuppressedDropdown = () => {
      document.body.classList.remove(suppressedDropdownBodyClass);
    };

    document.addEventListener('pointermove', clearSuppressedDropdown, { passive: true });
    document.addEventListener('keydown', clearSuppressedDropdown);

    return () => {
      document.removeEventListener('pointermove', clearSuppressedDropdown);
      document.removeEventListener('keydown', clearSuppressedDropdown);
    };
  }, []);

  function toggleDropdown(key: string) {
    setOpenDropdowns((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  function closeMobileMenu() {
    setIsMenuOpen(false);
    setOpenDropdowns(new Set());
  }

  function suppressDropdownAfterClick(key: string, event: MouseEvent<HTMLAnchorElement>) {
    closeMobileMenu();
    setDesktopDropdownKey(null);
    setSuppressedDropdownKey(key);
    document.body.classList.add(suppressedDropdownBodyClass);
    event.currentTarget.blur();
  }

  function openDesktopDropdown(key: string) {
    document.body.classList.remove(suppressedDropdownBodyClass);
    setDesktopDropdownKey(key);
  }

  function closeDesktopDropdown(key: string) {
    setDesktopDropdownKey((current) => (current === key ? null : current));
  }

  function clearSuppressedDropdown(key: string) {
    setSuppressedDropdownKey((current) => (current === key ? null : current));
  }

  function handleDropdownBlur(key: string, event: FocusEvent<HTMLLIElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      closeDesktopDropdown(key);
    }
  }

  return (
    <header
      className={[
        'header',
        'is-scrolled',
        isMenuOpen ? 'is-menu-open' : undefined,
        isRoutePending ? 'is-route-pending' : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
      data-component-root="header"
    >
      <div className="container">
        <Link className="logo" href={`/${locale}`} aria-label={t('nav.home')} data-nav="home">
          {displayedHeaderLogo ? (
            <Image
              className="logo-image logo-image-dark"
              src={displayedHeaderLogo.src}
              alt=""
              width={displayedHeaderLogo.width}
              height={displayedHeaderLogo.height}
              aria-hidden="true"
              priority
              onError={() =>
                isDisplayedHeaderLogoDark ? setHasDarkLogoError(true) : setHasLightLogoError(true)
              }
              unoptimized={shouldUseUnoptimizedImage(displayedHeaderLogo.src)}
            />
          ) : null}
          {shouldShowTextLogo ? <span className="logo-text">{siteSettings?.siteName}</span> : null}
        </Link>

        <nav
          className={isMenuOpen ? 'nav active' : 'nav'}
          id="primary-navigation"
          aria-label={t('nav.home')}
          data-mobile-open={isMenuOpen}
        >
          <ul>
            {resolvedNavigation.map((item) => {
              const isActive = activeKey === item.key;
              const dropdownId = `nav-dropdown-${item.key}`;
              const isDropdownOpen = openDropdowns.has(item.key);
              const isDropdownSuppressed = suppressedDropdownKey === item.key;
              const isDesktopDropdownOpen = desktopDropdownKey === item.key;
              const isProductsItem =
                item.href === '/products' || item.href.startsWith('/products?');

              return (
                <li
                  key={item.key}
                  className={[
                    item.children ? 'dropdown' : undefined,
                    isDropdownOpen ? 'is-open' : undefined,
                    isDesktopDropdownOpen ? 'is-dropdown-open' : undefined,
                    isDropdownSuppressed ? 'is-dropdown-suppressed' : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onBlurCapture={(event) => handleDropdownBlur(item.key, event)}
                  onFocusCapture={() => openDesktopDropdown(item.key)}
                  onMouseEnter={() => openDesktopDropdown(item.key)}
                  onMouseLeave={() => {
                    closeDesktopDropdown(item.key);
                    clearSuppressedDropdown(item.key);
                  }}
                  onPointerEnter={() => openDesktopDropdown(item.key)}
                  onPointerLeave={() => {
                    closeDesktopDropdown(item.key);
                    clearSuppressedDropdown(item.key);
                  }}
                >
                  <NavigationLink
                    ariaCurrent={isActive ? 'page' : undefined}
                    className={[
                      isActive ? 'active' : undefined,
                      item.isContact ? 'nav-contact-link' : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    dataNav={item.key}
                    item={item}
                    locale={locale}
                    onClick={(event) =>
                      item.children
                        ? suppressDropdownAfterClick(item.key, event)
                        : closeMobileMenu()
                    }
                    onNavigateStart={() => setIsRoutePending(true)}
                    pathname={pathname}
                  >
                    {item.label}
                  </NavigationLink>

                  {item.children ? (
                    <>
                      <button
                        className="dropdown-toggle"
                        type="button"
                        aria-expanded={isDropdownOpen}
                        aria-controls={dropdownId}
                        aria-label={item.label}
                        onClick={() => toggleDropdown(item.key)}
                      >
                        <span aria-hidden="true">{isDropdownOpen ? '-' : '+'}</span>
                      </button>
                      <ul
                        id={dropdownId}
                        className={isProductsItem ? 'dropdown-menu product-menu' : 'dropdown-menu'}
                      >
                        {item.children.map((child) => (
                          <li key={child.key}>
                            <NavigationLink
                              item={child}
                              locale={locale}
                              onClick={(event) => suppressDropdownAfterClick(item.key, event)}
                              onNavigateStart={() => setIsRoutePending(true)}
                              pathname={pathname}
                            >
                              {child.label}
                            </NavigationLink>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="header-actions">
          <SearchTrigger hotTerms={hotTerms} locale={locale} />
          <LanguageSwitcher locale={locale} />
        </div>

        <button
          className="mobile-menu-btn"
          type="button"
          aria-controls="primary-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

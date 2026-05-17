'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LanguageSwitcher } from '@/components/header/LanguageSwitcher';
import { SearchTrigger } from '@/components/header/SearchTrigger';
import type { Locale } from '@/lib/i18n/locale';
import { useTranslations } from '@/lib/i18n/useTranslations';
import { getActiveNavKey, localizeHref, mainNavigation, type NavKey } from '@/lib/navigation';

type HeaderProps = Readonly<{
  locale: Locale;
}>;

export function Header({ locale }: HeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const activeKey = getActiveNavKey(pathname, locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<NavKey>>(() => new Set());

  useEffect(() => {
    setIsMenuOpen(false);
    setOpenDropdowns(new Set());
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('is-nav-open', isMenuOpen);

    return () => {
      document.body.classList.remove('is-nav-open');
    };
  }, [isMenuOpen]);

  function toggleDropdown(key: NavKey) {
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

  return (
    <header
      className={['header', 'is-scrolled', isMenuOpen ? 'is-menu-open' : undefined]
        .filter(Boolean)
        .join(' ')}
      data-component-root="header"
    >
      <div className="container">
        <Link className="logo" href={`/${locale}`} aria-label={t('nav.home')} data-nav="home">
          <Image
            className="logo-image logo-image-light"
            src="/images/brand/yourfield-logo-official-a.png"
            alt=""
            width="233"
            height="75"
            aria-hidden="true"
          />
          <Image
            className="logo-image logo-image-dark"
            src="/images/brand/yourfield-logo-official-b.png"
            alt=""
            width="233"
            height="75"
            aria-hidden="true"
            priority
          />
        </Link>

        <nav
          className={isMenuOpen ? 'nav active' : 'nav'}
          id="primary-navigation"
          aria-label={t('nav.home')}
          data-mobile-open={isMenuOpen}
        >
          <ul>
            {mainNavigation.map((item) => {
              const isActive = activeKey === item.key;
              const dropdownId = `nav-dropdown-${item.key}`;
              const isDropdownOpen = openDropdowns.has(item.key);

              return (
                <li
                  key={item.labelKey}
                  className={[
                    item.children ? 'dropdown' : undefined,
                    isDropdownOpen ? 'is-open' : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Link
                    className={[
                      isActive ? 'active' : undefined,
                      item.isContact ? 'nav-contact-link' : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    href={localizeHref(locale, item)}
                    aria-current={isActive ? 'page' : undefined}
                    data-nav={item.key}
                    onClick={closeMobileMenu}
                  >
                    {t(item.labelKey)}
                  </Link>

                  {item.children ? (
                    <>
                      <button
                        className="dropdown-toggle"
                        type="button"
                        aria-expanded={isDropdownOpen}
                        aria-controls={dropdownId}
                        aria-label={t(item.labelKey)}
                        onClick={() => toggleDropdown(item.key)}
                      >
                        <span aria-hidden="true">{isDropdownOpen ? '-' : '+'}</span>
                      </button>
                      <ul
                        id={dropdownId}
                        className={
                          item.key === 'products' ? 'dropdown-menu product-menu' : 'dropdown-menu'
                        }
                      >
                        {item.children.map((child) => (
                          <li key={`${item.key}-${child.labelKey}`}>
                            <Link href={localizeHref(locale, child)} onClick={closeMobileMenu}>
                              {t(child.labelKey)}
                            </Link>
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
          <SearchTrigger locale={locale} />
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

import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/lib/i18n/locale';
import { footerGroups, localizeHref } from '@/lib/navigation';

type FooterProps = Readonly<{
  locale: Locale;
}>;

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations({ locale });

  return (
    <footer className="footer" id="site-footer" data-component-root="footer">
      <div className="container">
        <div className="footer-sitemap" aria-label="Footer content">
          <div className="footer-brand">
            <Link href={`/${locale}`} className="logo footer-logo" aria-label={t('nav.home')}>
              <Image
                className="logo-image"
                src="/images/brand/yourfield-logo-official-b.png"
                alt=""
                width="233"
                height="75"
                aria-hidden="true"
              />
            </Link>
            <p>{t('footer.brand')}</p>
            <ul className="footer-proof-list">
              <li>{t('footer.since')}</li>
              <li>{t('footer.globalManufacturing')}</li>
            </ul>
          </div>

          {footerGroups.map((group) => (
            <nav
              key={group.key}
              className={
                group.key === 'products' ? 'footer-links footer-products-nav' : 'footer-links'
              }
              aria-labelledby={`footer-${group.key}-title`}
            >
              <h4 id={`footer-${group.key}-title`}>{t(group.labelKey)}</h4>
              <ul className={group.key === 'products' ? 'footer-product-links' : undefined}>
                {group.links.map((link) => (
                  <li key={`${group.key}-${link.labelKey}`}>
                    <Link href={localizeHref(locale, link)}>{t(link.labelKey)}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="footer-contact-card" aria-labelledby="footer-contact-title">
            <h4 id="footer-contact-title">{t('nav.contact')}</h4>
            <address>
              <Link href={`/${locale}/contact#contact-info`}>{t('footer.address')}</Link>
              <a href="tel:+864006800181">{t('footer.phone')}</a>
              <a href="mailto:hnyf@yourfield.net">{t('footer.email')}</a>
            </address>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t('footer.copyright')}</p>
          <div className="footer-legal">
            <span className="footer-icp">{t('footer.icp')}</span>
            <span>{t('footer.policePlaceholder')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

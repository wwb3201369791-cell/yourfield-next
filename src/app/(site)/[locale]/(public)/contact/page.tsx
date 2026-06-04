import '@/styles/legacy-contact.css';

import Link from 'next/link';

import { LeadSubmitForm } from '@/components/forms/LeadSubmitForm';
import { JsonLd } from '@/components/public/JsonLd';
import { CompanyMap } from '@/components/ui/Map';
import { getCmsPageByKey } from '@/lib/cms/pages';
import { getCmsProductBySlug } from '@/lib/cms/products';
import { getCmsSiteSettings } from '@/lib/cms/site-settings';
import { env } from '@/lib/env';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocaleFromParams, type LocaleRouteParams } from '@/lib/i18n/route';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { localized } from '@/lib/product/types';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, contactPageJsonLd } from '@/lib/seo/jsonld';

type ContactPageProps = Readonly<{
  params: LocaleRouteParams;
  searchParams?: Promise<{
    product?: string;
  }>;
}>;

type ContactIconProps = Readonly<{
  type: 'address' | 'email' | 'phone';
}>;

function ContactIcon({ type }: ContactIconProps) {
  if (type === 'address') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (type === 'phone') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

export async function generateMetadata({ params }: ContactPageProps) {
  const locale = await resolveRouteLocaleFromParams(params);
  const isDraft = await isDraftModeEnabled();
  const page = await getCmsPageByKey(locale, 'contact', isDraft);

  return buildPageMetadata({
    locale,
    path: '/contact',
    title: page?.seoTitle || page?.title || '',
    description: page?.seoDescription || page?.heroSubtitle || '',
    image: page?.seoImage || page?.heroImage,
    noIndex: isDraft || Boolean(page?.noIndex),
  });
}

export default async function ContactPage({ params, searchParams }: ContactPageProps) {
  const locale = await resolveRouteLocaleFromParams(params);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const [page, siteSettings] = await Promise.all([
    getCmsPageByKey(locale, 'contact', isDraft),
    getCmsSiteSettings(locale),
  ]);
  const productKey = resolvedSearchParams.product?.trim() || undefined;
  const product = productKey ? await getCmsProductBySlug(locale, productKey, isDraft) : null;
  const productMessage = product
    ? t('page.contact.prefillProductMessage', { product: localized(product.name, locale) })
    : '';
  const heroImage = page?.heroImage;
  const contactAddress = siteSettings.contact.address;
  const contactPhone = siteSettings.contact.phone;
  const contactEmail = siteSettings.contact.email;
  const turnstileSiteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <>
      <JsonLd
        data={[
          contactPageJsonLd(locale, siteSettings),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: localizedPath(locale, '/') },
            { name: t('page.contact.title'), path: localizedPath(locale, '/contact') },
          ]),
        ]}
      />

      <main>
        {page?.heroEnabled !== false ? (
          <section
            className="contact-page-header"
            style={heroImage ? { backgroundImage: `url("${heroImage}")` } : undefined}
          >
            <div className="container">
              <h1>{page?.heroTitle || t('page.contact.title')}</h1>
              <div className="divider" aria-hidden="true" />
              <div className="breadcrumb" aria-label={t('page.contact.title')}>
                <Link href={`/${locale}`}>{t('nav.home')}</Link>
                <span>/</span>
                <span>{t('page.contact.title')}</span>
              </div>
            </div>
          </section>
        ) : null}

        <section className="contact-section" id="contact-info">
          <div className="container">
            <div className="contact-grid">
              <div className="contact-info" aria-label={t('page.contact.title')}>
                {page?.heroSubtitle ? (
                  <div className="contact-info-header">
                    <p>{page.heroSubtitle}</p>
                  </div>
                ) : null}

                <div className="info-cards">
                  {contactAddress ? (
                    <Link className="info-card info-card--address" href="#company-map-section">
                      <span className="info-icon" aria-hidden="true">
                        <ContactIcon type="address" />
                      </span>
                      <span className="info-content">
                        <h3>{t('page.contact.addressLabel')}</h3>
                        <p>{contactAddress}</p>
                      </span>
                    </Link>
                  ) : null}

                  {contactPhone && siteSettings.contact.phoneHref ? (
                    <Link className="info-card" href={siteSettings.contact.phoneHref}>
                      <span className="info-icon" aria-hidden="true">
                        <ContactIcon type="phone" />
                      </span>
                      <span className="info-content">
                        <h3>{t('page.contact.hotlineLabel')}</h3>
                        <p>{contactPhone}</p>
                      </span>
                    </Link>
                  ) : null}

                  {contactEmail && siteSettings.contact.emailHref ? (
                    <Link className="info-card" href={siteSettings.contact.emailHref}>
                      <span className="info-icon" aria-hidden="true">
                        <ContactIcon type="email" />
                      </span>
                      <span className="info-content">
                        <h3>{t('page.contact.emailLabel')}</h3>
                        <p>{contactEmail}</p>
                      </span>
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="contact-form-wrapper">
                <h3>{t('page.contact.formTitle')}</h3>
                <p>{t('page.contact.formIntro')}</p>
                <LeadSubmitForm
                  className="contact-form"
                  controlClassName="contact-control"
                  defaultInquiryType="message"
                  defaultMessage={productMessage}
                  fieldGridClassName="contact-form-row"
                  fields={[
                    {
                      autoComplete: 'name',
                      label: t('page.contact.nameLabel'),
                      name: 'name',
                      placeholder: t('page.contact.namePlaceholder'),
                      required: true,
                      type: 'text',
                    },
                    {
                      autoComplete: 'organization',
                      label: t('page.contact.companyLabel'),
                      name: 'company',
                      placeholder: t('page.contact.companyPlaceholder'),
                      type: 'text',
                    },
                    {
                      autoComplete: 'email',
                      label: t('page.contact.emailFieldLabel'),
                      name: 'email',
                      placeholder: t('page.contact.emailPlaceholder'),
                      required: true,
                      type: 'email',
                    },
                    {
                      autoComplete: 'tel',
                      label: t('page.contact.mobileLabel'),
                      name: 'mobile',
                      placeholder: t('page.contact.mobilePlaceholder'),
                      required: true,
                      type: 'tel',
                    },
                    {
                      autoComplete: 'country-name',
                      label: t('page.contact.countryLabel'),
                      name: 'country',
                      placeholder: t('page.contact.countryPlaceholder'),
                      type: 'text',
                    },
                  ]}
                  locale={locale}
                  messageLabel={t('page.contact.messageLabel')}
                  messagePlaceholder={t('page.contact.messagePlaceholder')}
                  submitLabel={t('page.contact.submit')}
                  supportEmail={contactEmail}
                  textareaClassName="contact-textarea"
                  {...(productKey ? { productKey } : {})}
                  {...(turnstileSiteKey ? { turnstileSiteKey } : {})}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="map-section" id="company-map-section">
          <span className="sr-only" id="map" />
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{t('page.contact.mapTag')}</span>
              <h2>{t('page.contact.mapTitle')}</h2>
            </div>
            <CompanyMap
              locale={locale}
              coordinates={siteSettings.coordinates}
              mapService={siteSettings.mapService}
              title={t('page.contact.mapPanelTitle')}
              text={t('page.contact.mapPanelText')}
              placeholder={t('page.contact.mapPlaceholder')}
              frameTitle={t('page.contact.mapFrameTitle')}
              openMapLabel={t('page.contact.openMap')}
            />
          </div>
        </section>
      </main>
    </>
  );
}

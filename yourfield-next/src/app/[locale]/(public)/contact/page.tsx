import Link from 'next/link';

import { JsonLd } from '@/components/public/JsonLd';
import { PageHero } from '@/components/public/PageHero';
import { SectionIntro } from '@/components/public/SectionIntro';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { getProductBySlug, localized } from '@/lib/mock/products';
import { breadcrumbJsonLd, contactPageJsonLd } from '@/lib/seo/jsonld';
import { buildPageMetadata, localizedPath } from '@/lib/seo/metadata';

type ContactPageProps = Readonly<{
  params: {
    locale: string;
  };
  searchParams?: {
    product?: string;
  };
}>;

export async function generateMetadata({ params }: ContactPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);

  return buildPageMetadata({
    locale,
    path: '/contact',
    title: t('page.contact.title'),
    description: t('page.contact.introText'),
    image: '/images/headers/contact-us.png',
  });
}

export default async function ContactPage({ params, searchParams }: ContactPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);
  const product = searchParams?.product ? getProductBySlug(searchParams.product) : null;
  const productMessage = product
    ? t('page.contact.prefillProductMessage', { product: localized(product.name, locale) })
    : '';

  return (
    <>
      <JsonLd
        data={[
          contactPageJsonLd(locale),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: localizedPath(locale, '/') },
            { name: t('page.contact.title'), path: localizedPath(locale, '/contact') },
          ]),
        ]}
      />
      <PageHero
        title={t('page.contact.title')}
        description={t('page.contact.introText')}
        image="/images/headers/contact-us.png"
        imageAlt={t('page.contact.title')}
        priority
      />

      <section id="contact-info" className="bg-white py-16 md:py-24">
        <div className="container grid gap-8 md:grid-cols-3">
          {[
            {
              labelKey: 'addressLabel',
              valueKey: 'addressValue',
              href: `/${locale}/contact#map`,
            },
            {
              labelKey: 'hotlineLabel',
              valueKey: 'hotlineValue',
              href: 'tel:+864006800181',
            },
            {
              labelKey: 'emailLabel',
              valueKey: 'emailValue',
              href: 'mailto:hnyf@yourfield.net',
            },
          ].map((item) => (
            <Link
              key={item.labelKey}
              className="rounded border border-border bg-bg-light p-6 hover:border-accent"
              href={item.href}
            >
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-accent">
                {t(`page.contact.${item.labelKey}`)}
              </p>
              <p className="mt-3 text-lg font-bold leading-7 text-primary">
                {t(`page.contact.${item.valueKey}`)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-bg-light py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionIntro
              align="left"
              eyebrow={t('page.contact.formTitle')}
              title={t('page.contact.formTitle')}
              text={t('page.contact.formIntro')}
            />
            <div className="rounded border border-border bg-white p-6">
              <h3 className="text-xl font-bold text-primary">
                {t('page.contact.formSummaryTitle')}
              </h3>
              <p className="mt-3 text-sm leading-7 text-text-light">
                {t('page.contact.formStatusMail')}
              </p>
            </div>
          </div>

          <form
            className="grid gap-4 rounded border border-border bg-white p-6 shadow-sm"
            action="mailto:hnyf@yourfield.net"
            method="post"
            encType="text/plain"
          >
            <label className="grid gap-2 text-sm font-bold text-primary">
              {t('page.contact.inquiryTypeLabel')}
              <select
                className="min-h-12 rounded border border-border bg-white px-4 text-base font-normal text-text"
                name="inquiryType"
                defaultValue="message"
              >
                <option value="message">{t('page.contact.inquiryTypeMessage')}</option>
                <option value="franchise">{t('page.contact.inquiryTypeFranchise')}</option>
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['name', 'nameLabel', 'namePlaceholder', 'text'],
                ['mobile', 'mobileLabel', 'mobilePlaceholder', 'tel'],
                ['email', 'emailFieldLabel', 'emailPlaceholder', 'email'],
                ['company', 'companyLabel', 'companyPlaceholder', 'text'],
              ].map(([name, labelKey, placeholderKey, type]) => (
                <label key={name} className="grid gap-2 text-sm font-bold text-primary">
                  {t(`page.contact.${labelKey}`)}
                  <input
                    className="min-h-12 rounded border border-border bg-bg-light px-4 text-base font-normal text-text"
                    name={name}
                    type={type}
                    placeholder={t(`page.contact.${placeholderKey}`)}
                  />
                </label>
              ))}
            </div>
            <label className="grid gap-2 text-sm font-bold text-primary">
              {t('page.contact.messageLabel')}
              <textarea
                className="min-h-36 rounded border border-border bg-bg-light px-4 py-3 text-base font-normal text-text"
                name="message"
                placeholder={t('page.contact.messagePlaceholder')}
                defaultValue={productMessage}
              />
            </label>
            <button className="btn btn-primary justify-self-start" type="submit">
              {t('page.contact.submit')}
            </button>
          </form>
        </div>
      </section>

      <section id="map" className="bg-white py-16 md:py-24">
        <div className="container">
          <SectionIntro
            eyebrow={t('page.contact.mapTag')}
            title={t('page.contact.mapTitle')}
            text={t('page.contact.mapPanelText')}
          />
          <div className="grid overflow-hidden rounded border border-border bg-bg-light shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex min-h-[320px] items-center justify-center bg-primary p-8 text-center text-white">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/70">
                  {t('page.contact.mapPanelTitle')}
                </p>
                <p className="mt-4 text-2xl font-bold text-white">{t('page.contact.mapAddress')}</p>
              </div>
            </div>
            <div className="p-7 md:p-10">
              <dl className="grid gap-5">
                <div>
                  <dt className="text-sm font-bold text-accent">
                    {t('page.contact.mapMetaCityLabel')}
                  </dt>
                  <dd className="mt-1 text-lg font-bold text-primary">
                    {t('page.contact.mapMetaCityValue')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-bold text-accent">
                    {t('page.contact.mapMetaAccessLabel')}
                  </dt>
                  <dd className="mt-1 text-lg font-bold text-primary">
                    {t('page.contact.mapMetaAccessValue')}
                  </dd>
                </div>
              </dl>
              <Link
                className="btn btn-secondary mt-8"
                href="https://www.google.com/maps/search/?api=1&query=%E6%B9%96%E5%8D%97%E7%9C%81%E6%B9%98%E6%BD%AD%E5%B8%82%E9%AB%98%E6%96%B0%E5%8C%BA%E5%88%9B%E4%B8%9A%E4%B8%9C%E8%B7%AF1%E5%8F%B7"
              >
                {t('page.contact.openMap')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

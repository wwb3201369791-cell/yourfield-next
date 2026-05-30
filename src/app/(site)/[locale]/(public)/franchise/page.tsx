import '@/styles/legacy-franchise.css';

import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';

import { LeadSubmitForm } from '@/components/forms/LeadSubmitForm';
import { JsonLd } from '@/components/public/JsonLd';
import { getCmsPageByKey } from '@/lib/cms/pages';
import { env } from '@/lib/env';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocaleFromParams, type LocaleRouteParams } from '@/lib/i18n/route';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';

type FranchisePageProps = Readonly<{
  params: LocaleRouteParams;
}>;

const valueMetrics = [1, 2, 3] as const;
const benefitItems = [1, 2, 3] as const;
const targetRows = [1, 2, 3, 4] as const;

const policies = [
  { id: 1, icon: '/images/franchise/policy-tax.svg' },
  { id: 2, icon: '/images/franchise/policy-space.svg' },
  { id: 3, icon: '/images/franchise/policy-rd.svg' },
  { id: 4, icon: '/images/franchise/policy-cross-border.svg' },
  { id: 5, icon: '/images/franchise/policy-talent.svg' },
  { id: 6, icon: '/images/franchise/policy-finance.svg' },
] as const;

const supportItems = [
  {
    id: 1,
    image: '/images/franchise/fast-entry-channel.png',
    altKey: 'page.franchise.supportImageAlt1',
  },
  {
    id: 2,
    image: '/images/franchise/global-promotion-plan.png',
    altKey: 'page.franchise.supportImageAlt2',
  },
  {
    id: 3,
    image: '/images/franchise/innovative-financial-support.png',
    altKey: 'page.franchise.supportImageAlt3',
  },
] as const;

const legacyFranchisePageTitles = new Set(['招商合作', 'Franchise', 'Франчайзинг']);

function normalizeFranchisePageTitle(title: string | undefined, fallback: string) {
  const normalized = title?.trim();

  if (!normalized || legacyFranchisePageTitles.has(normalized)) {
    return fallback;
  }

  return normalized;
}

export async function generateMetadata({ params }: FranchisePageProps) {
  const locale = await resolveRouteLocaleFromParams(params);
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const page = await getCmsPageByKey(locale, 'franchise', isDraft);
  const title = normalizeFranchisePageTitle(page?.seoTitle || page?.title, t('nav.franchise'));

  return buildPageMetadata({
    locale,
    path: '/franchise',
    title,
    description: page?.seoDescription || t('page.franchise.heroText'),
    image:
      page?.seoImage || page?.heroImage || '/images/headers/franchise-partnership-hero-full.jpg',
    noIndex: isDraft || Boolean(page?.noIndex),
  });
}

export default async function FranchisePage({ params }: FranchisePageProps) {
  const locale = await resolveRouteLocaleFromParams(params);
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const page = await getCmsPageByKey(locale, 'franchise', isDraft);
  const heroImage = page?.heroImage || '/images/headers/franchise-partnership.png';
  const turnstileSiteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd(
            t('nav.franchise'),
            t('page.franchise.heroText'),
            localizedPath(locale, '/franchise'),
          ),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: localizedPath(locale, '/') },
            { name: t('nav.franchise'), path: localizedPath(locale, '/franchise') },
          ]),
        ]}
      />

      <main className="franchise-page">
        {page?.heroEnabled !== false ? (
          <section
            className="franchise-hero"
            style={{ backgroundImage: `url("${heroImage}")` }}
            aria-labelledby="franchise-hero-title"
          >
            <div className="container">
              <div className="franchise-hero-copy">
                <span className="franchise-kicker">{t('page.franchise.kicker')}</span>
                <h1 id="franchise-hero-title">
                  {page?.heroTitle || t('page.franchise.heroTitle')}
                </h1>
                <p>{page?.heroSubtitle || t('page.franchise.heroText')}</p>
                <div className="franchise-actions">
                  <Link className="btn btn-primary btn-large" href="#franchise-inquiry">
                    {t('page.franchise.primaryCta')}
                  </Link>
                  <Link className="btn btn-outline btn-large" href="#franchise-targets">
                    {t('page.franchise.secondaryCta')}
                  </Link>
                </div>
              </div>

              <div
                className="franchise-stats"
                aria-label={t('page.franchise.valueHighlightsLabel')}
              >
                <article className="franchise-stat">
                  <Image
                    className="franchise-stat-media"
                    src="/images/about/built-up-area-stat.jpg"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 360px, 100vw"
                  />
                  <div className="franchise-stat-copy">
                    <strong>{t('page.franchise.statAreaValue')}</strong>
                    <span>{t('page.franchise.statAreaLabel')}</span>
                  </div>
                </article>
                <article className="franchise-stat">
                  <Image
                    className="franchise-stat-media"
                    src="/images/about/investment-amount-stat.png"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 360px, 100vw"
                  />
                  <div className="franchise-stat-copy">
                    <strong>{t('page.franchise.statInvestmentValue')}</strong>
                    <span>{t('page.franchise.statInvestmentLabel')}</span>
                  </div>
                </article>
              </div>
            </div>
          </section>
        ) : null}

        <section className="franchise-section white" id="franchise-value">
          <div className="park-layout container">
            <figure className="park-image">
              <Image
                src="/images/about/franchise-campus.jpg"
                alt={t('page.franchise.parkImageAlt')}
                width={900}
                height={620}
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <figcaption className="park-image-caption" aria-hidden="true">
                <span className="park-image-stat">
                  <strong>{t('page.franchise.statAreaValue')}</strong>
                  <span>{t('page.franchise.statAreaLabel')}</span>
                </span>
                <span className="park-image-stat">
                  <strong>{t('page.franchise.statInvestmentValue')}</strong>
                  <span>{t('page.franchise.statInvestmentLabel')}</span>
                </span>
              </figcaption>
            </figure>

            <div className="value-copy">
              <div className="franchise-heading">
                <span className="section-tag">{t('page.franchise.valueTag')}</span>
                <h2>{t('page.franchise.valueTitle')}</h2>
                <p>{t('page.franchise.valueText')}</p>
              </div>

              <ul
                className="value-highlights"
                aria-label={t('page.franchise.valueHighlightsLabel')}
              >
                {valueMetrics.map((item) => (
                  <li className="value-highlight" key={item}>
                    <strong>{t(`page.franchise.valueMetric${item}Value`)}</strong>
                    <em>{t(`page.franchise.valueMetric${item}Label`)}</em>
                  </li>
                ))}
              </ul>

              <ul className="benefit-list">
                {benefitItems.map((item) => (
                  <li className="benefit-item" key={item}>
                    <span aria-hidden="true">{item}</span>
                    <p>{t(`page.franchise.benefit${item}`)}</p>
                  </li>
                ))}
              </ul>

              <div className="strategy-copy">
                <h3>{t('page.franchise.strategyTitle')}</h3>
                <p>{t('page.franchise.strategyText')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="franchise-section" id="franchise-targets">
          <div className="container">
            <div className="franchise-heading">
              <span className="section-tag">{t('page.franchise.targetTag')}</span>
              <h2>{t('page.franchise.targetTitle')}</h2>
            </div>

            <div className="target-table-wrap">
              <table className="target-table">
                <colgroup>
                  <col />
                  <col />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">{t('page.franchise.targetTypeTitle')}</th>
                    <th scope="col">{t('page.franchise.targetFieldTitle')}</th>
                    <th scope="col">{t('page.franchise.targetStrategyTitle')}</th>
                  </tr>
                </thead>
                <tbody>
                  {targetRows.map((row) => (
                    <tr key={row}>
                      <td>{t(`page.franchise.targetType${row}`)}</td>
                      <td>
                        <span className="target-mobile-label">
                          {t('page.franchise.targetFieldTitle')}
                        </span>
                        {t(`page.franchise.targetField${row}`)}
                      </td>
                      <td>
                        <span className="target-mobile-label">
                          {t('page.franchise.targetStrategyTitle')}
                        </span>
                        {t(`page.franchise.targetStrategy${row}`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="franchise-section dark" id="franchise-policy">
          <div className="container">
            <div className="franchise-heading center">
              <span className="section-tag">{t('page.franchise.policyTag')}</span>
              <h2>{t('page.franchise.policyTitle')}</h2>
            </div>

            <div className="policy-grid">
              {policies.map((policy) => (
                <article className="policy-card" key={policy.id}>
                  <div>
                    <div className="policy-card-header">
                      <h3>{t(`page.franchise.policy${policy.id}Title`)}</h3>
                      <span className="policy-icon-slot" aria-hidden="true">
                        <Image
                          className="policy-icon"
                          src={policy.icon}
                          alt=""
                          width={40}
                          height={40}
                        />
                      </span>
                    </div>
                    <p>{t(`page.franchise.policy${policy.id}Text`)}</p>
                  </div>
                  <span className="policy-number" aria-hidden="true">
                    {policy.id}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="franchise-section white" id="franchise-support">
          <div className="container">
            <div className="franchise-heading center">
              <span className="section-tag">{t('page.franchise.supportTag')}</span>
              <h2>{t('page.franchise.supportTitle')}</h2>
            </div>

            <div className="support-grid">
              {supportItems.map((item) => (
                <Fragment key={item.id}>
                  <article className="support-item" key={`copy-${item.id}`}>
                    <h3>{t(`page.franchise.support${item.id}Title`)}</h3>
                    <strong>{t(`page.franchise.support${item.id}Sub`)}</strong>
                    <p>{t(`page.franchise.support${item.id}Text`)}</p>
                  </article>
                  <div className="support-item image" key={`image-${item.id}`}>
                    <Image
                      src={item.image}
                      alt={t(item.altKey)}
                      width={720}
                      height={420}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        <section className="franchise-section franchise-form-section" id="franchise-inquiry">
          <div className="franchise-form-layout container">
            <div className="franchise-form-copy">
              <h2>{t('page.franchise.formTitle')}</h2>
              <div className="divider" aria-hidden="true" />
              <p>{t('page.franchise.formText')}</p>
            </div>

            <LeadSubmitForm
              className="franchise-form"
              controlClassName="franchise-control"
              defaultInquiryType="franchise"
              fieldGridClassName="franchise-form-row"
              fields={[
                {
                  autoComplete: 'name',
                  label: t('page.franchise.formNameLabel'),
                  name: 'name',
                  placeholder: t('page.franchise.formNamePlaceholder'),
                  required: true,
                  type: 'text',
                },
                {
                  autoComplete: 'tel',
                  label: t('page.franchise.formMobileLabel'),
                  name: 'mobile',
                  placeholder: t('page.franchise.formMobilePlaceholder'),
                  required: true,
                  type: 'tel',
                },
                {
                  autoComplete: 'email',
                  label: t('page.franchise.formEmailLabel'),
                  name: 'email',
                  placeholder: t('page.franchise.formEmailPlaceholder'),
                  required: true,
                  type: 'email',
                },
                {
                  autoComplete: 'organization',
                  label: t('page.franchise.formCompanyLabel'),
                  name: 'company',
                  placeholder: t('page.franchise.formCompanyPlaceholder'),
                  type: 'text',
                },
              ]}
              locale={locale}
              messageLabel={t('page.franchise.formMessageLabel')}
              messagePlaceholder={t('page.franchise.formMessagePlaceholder')}
              submitLabel={t('page.franchise.formSubmit')}
              textareaClassName="franchise-textarea"
              {...(turnstileSiteKey ? { turnstileSiteKey } : {})}
            />
          </div>
        </section>
      </main>
    </>
  );
}

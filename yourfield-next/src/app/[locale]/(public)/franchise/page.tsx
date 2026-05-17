import Image from 'next/image';

import { JsonLd } from '@/components/public/JsonLd';
import { PageHero } from '@/components/public/PageHero';
import { SectionIntro } from '@/components/public/SectionIntro';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';
import { buildPageMetadata, localizedPath } from '@/lib/seo/metadata';

type FranchisePageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

const policies = [1, 2, 3, 4, 5, 6] as const;
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

export async function generateMetadata({ params }: FranchisePageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);

  return buildPageMetadata({
    locale,
    path: '/franchise',
    title: t('nav.franchise'),
    description: t('page.franchise.heroText'),
    image: '/images/headers/franchise-partnership-hero-full.jpg',
  });
}

export default async function FranchisePage({ params }: FranchisePageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);

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
      <PageHero
        eyebrow={t('page.franchise.kicker')}
        title={t('page.franchise.heroTitle')}
        description={t('page.franchise.heroText')}
        image="/images/headers/franchise-partnership-hero-full.jpg"
        imageAlt={t('page.franchise.parkImageAlt')}
        actions={[
          {
            href: `/${locale}/contact`,
            label: t('page.franchise.primaryCta'),
          },
          {
            href: '#franchise-targets',
            label: t('page.franchise.secondaryCta'),
            variant: 'secondary',
          },
        ]}
        priority
      />

      <section id="franchise-value" className="bg-white py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="section-tag">{t('page.franchise.valueTag')}</p>
            <h2>{t('page.franchise.valueTitle')}</h2>
            <p className="mt-4">{t('page.franchise.valueText')}</p>
            <ul className="mt-6 grid gap-3">
              {['benefit1', 'benefit2', 'benefit3'].map((key) => (
                <li key={key} className="flex gap-3 font-semibold text-primary">
                  <span className="mt-2 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                  {t(`page.franchise.${key}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded bg-bg-light shadow-lg">
            <Image
              className="h-full w-full object-cover"
              src="/images/home/franchise-campus-clean-hd-full.jpg"
              alt={t('page.franchise.parkImageAlt')}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>
        </div>
      </section>

      <section id="franchise-targets" className="bg-bg-light py-16 md:py-24">
        <div className="container">
          <SectionIntro
            eyebrow={t('page.franchise.targetTag')}
            title={t('page.franchise.targetTitle')}
            text={t('page.franchise.strategyText')}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {['targetType', 'targetField', 'targetStrategy'].map((group) => (
              <article key={group} className="rounded border border-border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-primary">
                  {t(`page.franchise.${group}Title`)}
                </h3>
                <ul className="mt-5 grid gap-3">
                  {[1, 2, 3, 4].map((item) => (
                    <li key={item} className="text-sm leading-7 text-text-light">
                      {t(`page.franchise.${group}${item}`)}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="franchise-policy" className="bg-white py-16 md:py-24">
        <div className="container">
          <SectionIntro
            eyebrow={t('page.franchise.policyTag')}
            title={t('page.franchise.policyTitle')}
            text={t('page.franchise.strategyText')}
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {policies.map((item) => (
              <article key={item} className="rounded border border-border bg-bg-light p-6">
                <span className="text-sm font-bold text-accent">0{item}</span>
                <h3 className="mt-3 text-xl font-bold text-primary">
                  {t(`page.franchise.policy${item}Title`)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-text-light">
                  {t(`page.franchise.policy${item}Text`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="franchise-support" className="bg-bg-light py-16 md:py-24">
        <div className="container">
          <SectionIntro
            eyebrow={t('page.franchise.supportTag')}
            title={t('page.franchise.supportTitle')}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {supportItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded border border-border bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    className="h-full w-full object-cover"
                    src={item.image}
                    alt={t(item.altKey)}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
                    {t(`page.franchise.support${item.id}Sub`)}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-primary">
                    {t(`page.franchise.support${item.id}Title`)}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-text-light">
                    {t(`page.franchise.support${item.id}Text`)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="franchise-inquiry" className="bg-white py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="section-tag">{t('page.franchise.formTitle')}</p>
            <h2>{t('page.franchise.formTitle')}</h2>
            <p className="mt-4">{t('page.franchise.formText')}</p>
          </div>
          <form
            className="grid gap-4 rounded border border-border bg-bg-light p-6"
            action="mailto:hnyf@yourfield.net"
            method="post"
            encType="text/plain"
          >
            {[
              ['name', 'formNameLabel', 'formNamePlaceholder', 'text'],
              ['mobile', 'formMobileLabel', 'formMobilePlaceholder', 'tel'],
              ['email', 'formEmailLabel', 'formEmailPlaceholder', 'email'],
              ['company', 'formCompanyLabel', 'formCompanyPlaceholder', 'text'],
            ].map(([name, labelKey, placeholderKey, type]) => (
              <label key={name} className="grid gap-2 text-sm font-bold text-primary">
                {t(`page.franchise.${labelKey}`)}
                <input
                  className="min-h-12 rounded border border-border bg-white px-4 text-base font-normal text-text"
                  name={name}
                  type={type}
                  placeholder={t(`page.franchise.${placeholderKey}`)}
                />
              </label>
            ))}
            <label className="grid gap-2 text-sm font-bold text-primary">
              {t('page.franchise.formMessageLabel')}
              <textarea
                className="min-h-32 rounded border border-border bg-white px-4 py-3 text-base font-normal text-text"
                name="message"
                placeholder={t('page.franchise.formMessagePlaceholder')}
              />
            </label>
            <button className="btn btn-primary justify-self-start" type="submit">
              {t('page.franchise.formSubmit')}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

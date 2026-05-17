import Image from 'next/image';

import { JsonLd } from '@/components/public/JsonLd';
import { PageHero } from '@/components/public/PageHero';
import { SectionIntro } from '@/components/public/SectionIntro';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd } from '@/lib/seo/jsonld';

type AboutPageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

const themes = ['group', 'medical', 'training', 'sewing'] as const;

const historyItems = [
  ['2002', 'page.about.groupMetric1Label'],
  ['2018', 'page.about.trainingMetric1Label'],
  ['2022', 'page.about.sewingMetric1Label'],
  ['2024', 'page.about.groupFact4'],
] as const;

export async function generateMetadata({ params }: AboutPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);

  return buildPageMetadata({
    locale,
    path: '/about',
    title: t('page.about.title'),
    description: t('page.about.groupBody1'),
    image: '/images/about/about-page-hero.png',
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t('nav.home'), path: localizedPath(locale, '/') },
          { name: t('page.about.title'), path: localizedPath(locale, '/about') },
        ])}
      />
      <PageHero
        title={t('page.about.title')}
        description={t('page.about.groupBody1')}
        image="/images/about/about-page-hero.png"
        imageAlt={t('page.about.groupCaption')}
        priority
      />

      <section id="company-profile" className="bg-white py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded bg-bg-light shadow-lg">
            <Image
              className="h-full w-full object-cover"
              src="/images/about/yourfield-production.png"
              alt={t('page.about.groupCaption')}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>
          <div>
            <p className="section-tag">{t('page.about.theme.group')}</p>
            <h2>{t('page.about.groupTitle')}</h2>
            <div className="mt-5 space-y-4">
              <p>{t('page.about.groupBody1')}</p>
              <p>{t('page.about.groupBody2')}</p>
              <p>{t('page.about.groupBody3')}</p>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="border-l-4 border-accent bg-bg-light p-4">
                  <div className="text-2xl font-bold text-primary">
                    {t(`page.about.groupMetric${item}Value`)}
                  </div>
                  <p className="mt-1 text-sm text-text-light">
                    {t(`page.about.groupMetric${item}Label`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="culture" className="bg-bg-light py-16 md:py-24">
        <div className="container">
          <SectionIntro
            eyebrow={t('page.about.cultureTag')}
            title={t('page.about.cultureTitle')}
            text={t('page.about.cultureText')}
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <article key={item} className="rounded border border-border bg-white p-6 shadow-sm">
                <span className="text-sm font-bold text-accent">0{item}</span>
                <h3 className="mt-3 text-xl font-bold text-primary">
                  {t(`page.about.spirit${item}Title`)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-text-light">
                  {t(`page.about.spirit${item}Text`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="honors" className="bg-white py-16 md:py-24">
        <div className="container">
          <SectionIntro
            eyebrow={t('page.about.honorsTag')}
            title={t('page.about.honorsTitle')}
            text={t('page.about.certTitle')}
          />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              'iso-9001-quality-management.jpg',
              'iso-13485-medical-device-quality.jpg',
              'iso-45001-occupational-health-safety.jpg',
            ].map((image, index) => (
              <figure
                key={image}
                className="overflow-hidden rounded border border-border bg-bg-light p-4"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded bg-white">
                  <Image
                    className="h-full w-full object-contain"
                    src={`/images/certifications/${image}`}
                    alt={`${t('page.about.enterpriseQualifications')} ${index + 1}`}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                </div>
                <figcaption className="mt-4 text-sm font-semibold text-primary">
                  {t('page.about.enterpriseQualifications')}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="history" className="bg-primary py-16 text-white md:py-24">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-white/70">
              {t('page.about.historyTag')}
            </p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              {t('page.about.historyTitle')}
            </h2>
            <p className="text-white/76 mt-4 text-base leading-8 md:text-lg">
              {t('page.about.groupBody2')}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {historyItems.map(([year, textKey]) => (
              <article key={year} className="border-white/24 border-t pt-5">
                <div className="text-3xl font-bold text-white">{year}</div>
                <p className="text-white/76 mt-3 text-sm leading-7">{t(textKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="strategic-partners" className="bg-bg-light py-16 md:py-24">
        <div className="container">
          <SectionIntro
            eyebrow={t('page.about.partnersTag')}
            title={t('page.about.partnersTitle')}
            text={t('page.about.partnersText')}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {themes.map((theme) => (
              <article key={theme} className="rounded border border-border bg-white p-6">
                <p className="text-sm font-bold text-accent">{t(`page.about.theme.${theme}`)}</p>
                <h3 className="mt-3 text-xl font-bold text-primary">
                  {t(`page.about.${theme}Title`)}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

import Image from 'next/image';
import Link from 'next/link';

import { CtaBand } from '@/components/public/CtaBand';
import { JsonLd } from '@/components/public/JsonLd';
import { PageHero } from '@/components/public/PageHero';
import { SectionIntro } from '@/components/public/SectionIntro';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { industryCases, solutionProfiles } from '@/lib/mock/solutions';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';
import { buildPageMetadata, localizedPath } from '@/lib/seo/metadata';

type SolutionsPageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

export async function generateMetadata({ params }: SolutionsPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);

  return buildPageMetadata({
    locale,
    path: '/solutions',
    title: t('page.solutions.title'),
    description: t('page.solutions.introText'),
    image: '/images/solutions/solution-power-grid.jpg',
  });
}

export default async function SolutionsPage({ params }: SolutionsPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd(
            t('page.solutions.title'),
            t('page.solutions.introText'),
            localizedPath(locale, '/solutions'),
          ),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: localizedPath(locale, '/') },
            { name: t('page.solutions.title'), path: localizedPath(locale, '/solutions') },
          ]),
        ]}
      />
      <PageHero
        eyebrow={t('page.solutions.tag')}
        title={t('page.solutions.introTitle')}
        description={t('page.solutions.introText')}
        image="/images/solutions/solution-power-grid.jpg"
        imageAlt={t('page.solutions.powerAlt')}
        priority
      />

      <section className="bg-white py-16 md:py-24">
        <div className="container grid gap-8">
          {solutionProfiles.map((solution, index) => (
            <article
              key={solution.id}
              id={solution.id}
              className="scroll-mt-28 overflow-hidden rounded border border-border bg-bg-light shadow-sm"
            >
              <div
                className={[
                  'grid gap-0 lg:grid-cols-2',
                  index % 2 === 1 ? 'lg:[&>div:first-child]:order-2' : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="relative min-h-[300px]">
                  <Image
                    className="h-full w-full object-cover"
                    src={solution.image}
                    alt={t(solution.altKey)}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </div>
                <div className="p-7 md:p-10">
                  <p className="section-tag">{t(solution.labelKey)}</p>
                  <h2>{t(solution.titleKey)}</h2>
                  <p className="mt-4">{t(solution.textKey)}</p>
                  <ul className="mt-6 grid gap-3">
                    {solution.featureKeys.map((featureKey) => (
                      <li
                        key={featureKey}
                        className="flex gap-3 text-sm font-semibold text-primary"
                      >
                        <span className="mt-2 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                        {t(featureKey)}
                      </li>
                    ))}
                  </ul>
                  <div
                    className="mt-6 flex flex-wrap gap-2"
                    aria-label={t('page.solutions.productsLabel')}
                  >
                    {solution.productTagKeys.map((tagKey) => (
                      <span
                        key={tagKey}
                        className="border-primary/15 rounded-full border bg-white px-3 py-1 text-xs font-bold text-primary"
                      >
                        {t(tagKey)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-bg-light py-16 md:py-24">
        <div className="container">
          <SectionIntro
            eyebrow={t('page.solutions.casesTag')}
            title={t('page.solutions.casesTitle')}
            text={t('page.solutions.casesIntro')}
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {industryCases.map((item) => (
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
                    sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
                    {t(item.metaKey)}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-primary">{t(item.titleKey)}</h3>
                  <p className="mt-3 text-sm leading-6 text-text-light">{t(item.textKey)}</p>
                  <Link
                    className="mt-5 inline-flex text-sm font-bold text-primary hover:text-accent"
                    href={`/${locale}/contact`}
                  >
                    {t('page.solutions.caseAction')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title={t('page.solutions.ctaTitle')}
        text={t('page.solutions.ctaText')}
        primaryHref={`/${locale}/contact`}
        primaryLabel={t('page.solutions.ctaPrimary')}
        secondaryHref={`/${locale}/products`}
        secondaryLabel={t('page.solutions.ctaSecondary')}
      />
    </>
  );
}

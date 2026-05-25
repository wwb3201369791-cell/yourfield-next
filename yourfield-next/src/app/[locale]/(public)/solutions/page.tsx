import '@/styles/legacy-solutions.css';

import Image from 'next/image';
import Link from 'next/link';

import { JsonLd } from '@/components/public/JsonLd';
import { getCmsPageByKey } from '@/lib/cms/pages';
import { getCmsSolutions } from '@/lib/cms/solutions';
import { buildSolutionsPageSections } from '@/lib/content/solutionPage';
import { industryCases } from '@/lib/content/solutions';
import { getTranslations } from '@/lib/i18n/getTranslations';
import type { Locale } from '@/lib/i18n/locale';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';

type SolutionsPageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

const industryCaseAnchors: Record<string, string> = {
  'case-electronics': 'industry-electronics',
  'case-emergency': 'industry-emergency',
  'case-food': 'industry-food',
  'case-manufacturing': 'industry-manufacturing',
  'case-medical': 'industry-medical',
  'case-metal': 'industry-metal',
  'case-petro': 'industry-petrochemical',
  'case-power': 'industry-power',
};

function emptySolutionsCopy(locale: Locale) {
  if (locale === 'en') {
    return {
      text: 'Create and publish solution records in the admin to show them here.',
      title: 'No published solutions yet',
    };
  }

  if (locale === 'ru') {
    return {
      text: 'Создайте и опубликуйте решения в панели управления, чтобы показать их здесь.',
      title: 'Пока нет опубликованных решений',
    };
  }

  return {
    text: '请先在后台创建并发布解决方案，前台会自动同步展示。',
    title: '暂未发布解决方案',
  };
}

export async function generateMetadata({ params }: SolutionsPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const isDraft = isDraftModeEnabled();
  const t = await getTranslations(locale);
  const page = await getCmsPageByKey(locale, 'solutions', isDraft);
  const fallbackDescription = t('page.solutions.introText');

  return buildPageMetadata({
    locale,
    path: '/solutions',
    title: page?.seoTitle || page?.title || t('page.solutions.title'),
    description: page?.seoDescription || fallbackDescription,
    image: page?.seoImage || page?.heroImage || '/images/solutions/solution-power-grid.jpg',
    noIndex: isDraft || Boolean(page?.noIndex),
  });
}

export default async function SolutionsPage({ params }: SolutionsPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const isDraft = isDraftModeEnabled();
  const t = await getTranslations(locale);
  const page = await getCmsPageByKey(locale, 'solutions', isDraft);
  const cmsSolutions = await getCmsSolutions(locale, isDraft);
  const heroImage = page?.heroImage || '/images/solutions/solution-power-grid.jpg';
  const solutionSections = buildSolutionsPageSections(cmsSolutions);
  const emptyCopy = emptySolutionsCopy(locale);

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

      {page?.heroEnabled !== false ? (
        <section
          className="page-header solutions-page-header"
          aria-labelledby="solutions-page-title"
          style={{
            backgroundImage: `url("${heroImage}")`,
          }}
        >
          <div className="container">
            <h1 id="solutions-page-title">{page?.heroTitle || t('page.solutions.title')}</h1>
            <div className="divider" aria-hidden="true" />
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link href={`/${locale}`}>{t('nav.home')}</Link>
              <span aria-hidden="true">/</span>
              <span>{t('page.solutions.title')}</span>
            </nav>
          </div>
        </section>
      ) : null}

      <section className="solutions-intro">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{t('page.solutions.tag')}</span>
            <h2>{page?.heroSubtitle || t('page.solutions.introTitle')}</h2>
          </div>
          <p>{t('page.solutions.introText')}</p>
        </div>
      </section>

      <section className="industry-solutions">
        <div className="container">
          {solutionSections.isEmpty ? (
            <div className="solutions-empty-state">
              <h2>{emptyCopy.title}</h2>
              <p>{emptyCopy.text}</p>
            </div>
          ) : (
            solutionSections.detailCards.map((solution) => (
              <article key={solution.id} id={solution.id} className="solution-card">
                <div className="solution-image">
                  <Image
                    src={solution.image}
                    alt={solution.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </div>
                <div className="solution-content">
                  <div className="solution-icon">{t('page.solutions.tag')}</div>
                  <h2>{solution.title}</h2>
                  <p>{solution.text}</p>
                  {solution.features.length > 0 ? (
                    <ul className="solution-features">
                      {solution.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  ) : null}
                  {solution.productTags.length > 0 ? (
                    <div className="products-used">
                      <h3>{t('page.solutions.productsLabel')}</h3>
                      <div className="product-tags">
                        {solution.productTags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <Link className="btn btn-primary mt-5" href={`/${locale}/products`}>
                    {t('common.viewProducts')}
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="case-studies">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{t('page.solutions.casesTag')}</span>
            <h2>{t('page.solutions.casesTitle')}</h2>
            <p>{t('page.solutions.casesIntro')}</p>
          </div>
          <div className="cases-grid">
            {industryCases.map((item) => {
              const anchor = industryCaseAnchors[item.id] ?? item.id;

              return (
                <Link key={item.id} className="case-card" href={`/${locale}/products#${anchor}`}>
                  <div className="case-image">
                    <Image
                      src={item.image}
                      alt={t(item.altKey)}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                  <div className="case-content">
                    <h3>{t(item.titleKey)}</h3>
                    <p>{t(item.textKey)}</p>
                    <div className="case-meta">
                      <span>{t(item.metaKey)}</span>
                      <span>{t('page.solutions.caseAction')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

    </>
  );
}

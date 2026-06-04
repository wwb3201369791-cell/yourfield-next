import '@/styles/legacy-solutions.css';

import Image from 'next/image';
import Link from 'next/link';

import { JsonLd } from '@/components/public/JsonLd';
import { shouldUseUnoptimizedImage } from '@/lib/cms/media';
import { getCmsPageByKey } from '@/lib/cms/pages';
import { getCmsSolutions } from '@/lib/cms/solutions';
import { buildSolutionsPageSections } from '@/lib/content/solutionPage';
import { getTranslations } from '@/lib/i18n/getTranslations';
import type { Locale } from '@/lib/i18n/locale';
import { resolveRouteLocaleFromParams, type LocaleRouteParams } from '@/lib/i18n/route';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';

type SolutionsPageProps = Readonly<{
  params: LocaleRouteParams;
}>;

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
  const locale = await resolveRouteLocaleFromParams(params);
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const page = await getCmsPageByKey(locale, 'solutions', isDraft);
  const fallbackDescription = t('page.solutions.introText');
  const metadataImage = page?.seoImage || page?.heroImage;

  return buildPageMetadata({
    locale,
    path: '/solutions',
    title: page?.seoTitle || page?.title || t('page.solutions.title'),
    description: page?.seoDescription || fallbackDescription,
    ...(metadataImage ? { image: metadataImage } : {}),
    noIndex: isDraft || Boolean(page?.noIndex),
  });
}

export default async function SolutionsPage({ params }: SolutionsPageProps) {
  const locale = await resolveRouteLocaleFromParams(params);
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const page = await getCmsPageByKey(locale, 'solutions', isDraft);
  const cmsSolutions = await getCmsSolutions(locale, isDraft);
  const heroImage = page?.heroImage;
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
          style={heroImage ? { backgroundImage: `url("${heroImage}")` } : undefined}
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
                {solution.image ? (
                  <div className="solution-image">
                    <Image
                      src={solution.image}
                      alt={solution.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      unoptimized={shouldUseUnoptimizedImage(solution.image)}
                    />
                  </div>
                ) : null}
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
    </>
  );
}

import { Suspense } from 'react';

import { JsonLd } from '@/components/public/JsonLd';
import { PageHero } from '@/components/public/PageHero';
import { SearchResultsPage, type SearchResultsCopy } from '@/components/search/SearchResultsPage';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocale } from '@/lib/i18n/route';
import { getPayloadHotSearchTerms } from '@/lib/search/payload';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/lib/seo/jsonld';

type SearchPageProps = Readonly<{
  params: {
    locale: string;
  };
}>;

function splitTerms(value: string) {
  return value
    .split('|')
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function SearchPageFallback() {
  return (
    <section className="bg-white py-14 md:py-20">
      <div className="container">
        <div className="rounded border border-border bg-bg-light p-5">
          <div className="h-12 animate-pulse rounded bg-white" />
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="h-72 animate-pulse rounded border border-border bg-bg-light" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded border border-border bg-bg-light"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export async function generateMetadata({ params }: SearchPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);

  return buildPageMetadata({
    locale,
    path: '/search',
    title: t('search.pageTitle'),
    description: t('search.pageDescription'),
    image: '/images/headers/products-center.png',
    noIndex: true,
  });
}

export default async function SearchPage({ params }: SearchPageProps) {
  const locale = resolveRouteLocale(params.locale);
  const t = await getTranslations(locale);
  const copy: SearchResultsCopy = {
    allCategories: t('search.allCategories'),
    categoryLabel: t('search.categoryLabel'),
    clear: t('search.clear'),
    clearFilters: t('search.clearFilters'),
    contentTypeLabel: t('search.contentTypeLabel'),
    emptyText: t('search.emptyText'),
    emptyTitle: t('search.emptyTitle'),
    filtersLabel: t('search.filtersLabel'),
    loading: t('search.loading'),
    loadingShort: t('search.loadingShort'),
    networkErrorText: t('search.networkErrorText'),
    networkErrorTitle: t('search.networkErrorTitle'),
    noResultsText: t('search.noResultsContentText'),
    noResultsTitle: t('search.noResultsContentTitle'),
    openResult: t('search.openResult'),
    pageLabel: t('search.pageLabel'),
    paginationNext: t('search.paginationNext'),
    paginationPrevious: t('search.paginationPrevious'),
    placeholder: t('search.placeholder'),
    popular: t('search.popular'),
    queryLabel: t('search.label'),
    rateLimitText: t('search.rateLimitText'),
    rateLimitTitle: t('search.rateLimitTitle'),
    recent: t('search.recent'),
    resultCount: t('search.resultCount'),
    resultsFor: t('search.resultsFor'),
    retry: t('search.retry'),
    searchLabel: t('search.pageTitle'),
    submit: t('search.submit'),
    typeLabels: {
      all: t('search.type.all'),
      faq: t('search.type.faq'),
      'industry-case': t('search.type.industry-case'),
      news: t('search.type.news'),
      page: t('search.type.page'),
      product: t('search.type.product'),
      solution: t('search.type.solution'),
    },
    validationErrorText: t('search.validationErrorText'),
    validationErrorTitle: t('search.validationErrorTitle'),
  };
  const fallbackHotTerms = splitTerms(t('search.hotTerms'));
  const hotTerms = await getPayloadHotSearchTerms(locale, fallbackHotTerms, 8);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd(
            t('search.pageTitle'),
            t('search.pageDescription'),
            localizedPath(locale, '/search'),
          ),
          breadcrumbJsonLd([
            { name: t('nav.home'), path: localizedPath(locale, '/') },
            { name: t('search.pageTitle'), path: localizedPath(locale, '/search') },
          ]),
        ]}
      />
      <PageHero
        title={t('search.pageTitle')}
        description={t('search.pageDescription')}
        image="/images/headers/products-center.png"
        imageAlt={t('search.pageTitle')}
        priority
      />
      <Suspense fallback={<SearchPageFallback />}>
        <SearchResultsPage copy={copy} hotTerms={hotTerms} locale={locale} />
      </Suspense>
    </>
  );
}

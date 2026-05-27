'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import type { Locale } from '@/lib/i18n/locale';
import type { SearchHit, SearchResponse } from '@/lib/search/types';

import type {
  SearchResultsCopy,
  SearchUrlPatch,
  SearchUrlState,
  UiError,
} from './search-results-types';
import {
  compactSearchTerms,
  recommendedProductsTitle,
  SearchErrorNotice,
  SearchHitCard,
  SearchPrompt,
  SearchSkeleton,
  SearchTermButton,
} from './search-results-utils';

type SearchResultsPanelProps = Readonly<{
  copy: SearchResultsCopy;
  error: UiError | null;
  hasQuery: boolean;
  hotTerms: readonly string[];
  isLoading: boolean;
  locale: Locale;
  onOpenResult: (hit: SearchHit) => void;
  onRetry: () => void;
  onTermClick: (term: string) => void;
  pages: readonly number[];
  recentSearches: readonly string[];
  response: SearchResponse | null;
  updateUrl: (patch: SearchUrlPatch) => void;
  urlState: SearchUrlState;
}>;

export function SearchResultsPanel({
  copy,
  error,
  hasQuery,
  hotTerms,
  isLoading,
  locale,
  onOpenResult,
  onRetry,
  onTermClick,
  pages,
  recentSearches,
  response,
  updateUrl,
  urlState,
}: SearchResultsPanelProps) {
  return (
    <div aria-busy={isLoading}>
      {isLoading ? (
        <p className="sr-only" role="status">
          {copy.loading}
        </p>
      ) : null}
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-accent">
            {copy.resultsFor}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-primary">
            {hasQuery ? compactSearchTerms(urlState.q) : copy.emptyTitle}
          </h2>
        </div>
        {response && hasQuery ? (
          <p className="text-sm font-semibold text-text-light">
            {response.totalHits} {copy.resultCount}
          </p>
        ) : null}
      </div>

      {isLoading ? <SearchSkeleton /> : null}

      {!isLoading && error ? (
        <SearchErrorNotice error={error} retryLabel={copy.retry} onRetry={onRetry} />
      ) : null}

      {!isLoading && !error && response?.empty?.reason === 'EMPTY_QUERY' ? (
        <SearchPrompt
          copy={copy}
          hotTerms={hotTerms}
          onTermClick={onTermClick}
          recentSearches={recentSearches}
        />
      ) : null}

      {!isLoading && !error && response?.empty?.reason === 'NO_RESULTS' ? (
        <div className="rounded border border-border bg-bg-light p-6 md:p-8">
          <h2 className="text-2xl font-bold text-primary">{copy.noResultsTitle}</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-text-light">
            {copy.noResultsText}
          </p>
          {hotTerms.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-accent">
                {copy.popular}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {hotTerms.map((term) => (
                  <SearchTermButton key={term} onClick={onTermClick}>
                    {term}
                  </SearchTermButton>
                ))}
              </div>
            </div>
          ) : null}

          {response.recommendations?.products.length ? (
            <div className="mt-8">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-accent">
                {recommendedProductsTitle(locale, copy.typeLabels.product)}
              </h3>
              <div className="mt-3 grid gap-4">
                {response.recommendations.products.map((hit) => (
                  <SearchHitCard
                    key={hit.id}
                    copy={copy}
                    hit={hit}
                    locale={locale}
                    onOpenResult={onOpenResult}
                    query={response.query}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !error && response && response.hits.length > 0 ? (
        <>
          <div className="grid gap-4">
            {response.hits.map((hit) => (
              <SearchHitCard
                key={hit.id}
                copy={copy}
                hit={hit}
                locale={locale}
                onOpenResult={onOpenResult}
                query={response.query}
              />
            ))}
          </div>

          {response.pagination.totalPages > 1 ? (
            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
              aria-label={copy.pageLabel}
            >
              <button
                className="btn btn-secondary gap-2 px-4"
                type="button"
                disabled={!response.pagination.hasPreviousPage}
                onClick={() => updateUrl({ page: response.pagination.page - 1 })}
              >
                <ChevronLeftIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
                {copy.paginationPrevious}
              </button>
              {pages.map((page) => (
                <button
                  key={page}
                  className={[
                    'flex h-11 min-w-11 items-center justify-center rounded border px-3 text-sm font-bold transition',
                    page === response.pagination.page
                      ? 'border-accent bg-accent text-white'
                      : 'border-border bg-white text-primary hover:border-accent hover:text-accent',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  type="button"
                  aria-current={page === response.pagination.page ? 'page' : undefined}
                  onClick={() => updateUrl({ page })}
                >
                  {page}
                </button>
              ))}
              <button
                className="btn btn-secondary gap-2 px-4"
                type="button"
                disabled={!response.pagination.hasNextPage}
                onClick={() => updateUrl({ page: response.pagination.page + 1 })}
              >
                {copy.paginationNext}
                <ChevronRightIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
              </button>
            </nav>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

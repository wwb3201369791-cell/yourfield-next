'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { ArrowRightIcon } from '@/components/ui/icons';
import type { Locale } from '@/lib/i18n/locale';
import {
  searchRequestTypes,
  type SearchHit,
  type SearchRequestType,
  type SearchResponse,
} from '@/lib/search/types';

import type {
  SearchApiErrorResponse,
  SearchResultsCopy,
  SearchUrlState,
  UiError,
} from './search-results-types';

export const defaultHitsPerPage = 8;
export const maxQueryLength = 80;
export const recentSearchLimit = 5;

function isSearchRequestType(value: string | null): value is SearchRequestType {
  return searchRequestTypes.includes(value as SearchRequestType);
}

function readPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readSearchUrlState(searchParams: Pick<URLSearchParams, 'get'>): SearchUrlState {
  const type = searchParams.get('type');

  return {
    category: searchParams.get('category') ?? '',
    hitsPerPage: readPositiveInteger(searchParams.get('hitsPerPage'), defaultHitsPerPage),
    page: readPositiveInteger(searchParams.get('page'), 1),
    q: searchParams.get('q') ?? '',
    type: isSearchRequestType(type) ? type : 'all',
  };
}

export function compactSearchTerms(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function formatDate(value: string | undefined, locale: Locale) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getHighlightNeedle(text: string, query: string) {
  const normalizedText = text.toLocaleLowerCase();
  const candidates = [query, ...query.split(/\s+/)]
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .sort((left, right) => right.length - left.length);

  return candidates.find((item) => normalizedText.includes(item.toLocaleLowerCase())) ?? '';
}

function highlightText(text: string, query: string): ReactNode {
  const needle = getHighlightNeedle(text, query);

  if (!needle) {
    return text;
  }

  const lowerText = text.toLocaleLowerCase();
  const lowerNeedle = needle.toLocaleLowerCase();
  const start = lowerText.indexOf(lowerNeedle);

  if (start < 0) {
    return text;
  }

  const end = start + needle.length;

  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-accent/15 rounded px-0.5 text-primary">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export function paginationPages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const first = Math.max(1, Math.min(currentPage - 2, totalPages - 4));

  return Array.from({ length: 5 }, (_, index) => first + index);
}

export function safeInternalHref(url: string) {
  return url.startsWith('/') ? url : '/';
}

export function SearchSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded border border-border bg-white p-5 shadow-sm">
          <div className="space-y-3 py-1">
            <div className="h-4 w-28 animate-pulse rounded bg-bg-light" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-bg-light" />
            <div className="h-4 w-full animate-pulse rounded bg-bg-light" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-bg-light" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchTermButton({
  children,
  onClick,
}: Readonly<{
  children: string;
  onClick: (term: string) => void;
}>) {
  return (
    <button
      className="border-primary/15 rounded-full border bg-white px-3 py-1.5 text-sm font-semibold text-primary transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      type="button"
      onClick={() => onClick(children)}
    >
      {children}
    </button>
  );
}

export function recommendedProductsTitle(locale: Locale, productLabel: string) {
  if (locale === 'zh') {
    return `推荐${productLabel}`;
  }

  if (locale === 'ru') {
    return `Рекомендуемые ${productLabel.toLocaleLowerCase()}`;
  }

  return `Recommended ${productLabel.toLocaleLowerCase()}`;
}

export function SearchPrompt({
  copy,
  hotTerms,
  onTermClick,
  recentSearches,
}: Readonly<{
  copy: SearchResultsCopy;
  hotTerms: readonly string[];
  onTermClick: (term: string) => void;
  recentSearches: readonly string[];
}>) {
  return (
    <div className="rounded border border-border bg-bg-light p-6 md:p-8">
      <h2 className="text-2xl font-bold text-primary">{copy.emptyTitle}</h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-text-light">{copy.emptyText}</p>

      {recentSearches.length > 0 ? (
        <div className="mt-7">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-accent">
            {copy.recent}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentSearches.map((term) => (
              <SearchTermButton key={term} onClick={onTermClick}>
                {term}
              </SearchTermButton>
            ))}
          </div>
        </div>
      ) : null}

      {hotTerms.length > 0 ? (
        <div className="mt-7">
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
    </div>
  );
}

export function SearchErrorNotice({
  error,
  onRetry,
  retryLabel,
}: Readonly<{
  error: UiError;
  onRetry: () => void;
  retryLabel: string;
}>) {
  return (
    <div className="rounded border border-border bg-bg-light p-6 md:p-8">
      <h2 className="text-2xl font-bold text-primary">{error.title}</h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-text-light">{error.text}</p>
      {error.retryable ? (
        <button className="btn btn-secondary mt-6" type="button" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export function SearchHitCard({
  copy,
  hit,
  locale,
  onOpenResult,
  query,
}: Readonly<{
  copy: SearchResultsCopy;
  hit: SearchHit;
  locale: Locale;
  onOpenResult: (hit: SearchHit) => void;
  query: string;
}>) {
  const date = formatDate(hit.publishedAt, locale);
  const meta = [
    copy.typeLabels[hit.type],
    hit.category?.name ?? hit.category?.id,
    hit.model,
    hit.sku && hit.sku !== hit.model ? hit.sku : undefined,
    date ?? undefined,
  ].filter((item): item is string => Boolean(item));

  return (
    <article className="rounded border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-accent">
          {meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <h2 className="mt-2 text-2xl font-bold leading-snug text-primary">
          <Link href={safeInternalHref(hit.url)} onClick={() => onOpenResult(hit)}>
            {highlightText(hit.title, query)}
          </Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-light">
          {highlightText(hit.excerpt, query)}
        </p>
        <Link
          className="mt-5 inline-flex items-center gap-2 self-start text-sm font-bold text-primary hover:text-accent"
          href={safeInternalHref(hit.url)}
          onClick={() => onOpenResult(hit)}
        >
          {copy.openResult}
          <ArrowRightIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
        </Link>
      </div>
    </article>
  );
}

export function selectedTypeCount(response: SearchResponse | null, type: SearchRequestType) {
  if (!response) {
    return 0;
  }

  if (type === 'all') {
    return Object.values(response.facets.types).reduce((total, count) => total + count, 0);
  }

  return response.facets.types[type] ?? 0;
}

export function errorFromPayload(
  payload: SearchApiErrorResponse,
  copy: SearchResultsCopy,
): UiError {
  if (payload.error?.code === 'VALIDATION_ERROR') {
    return {
      retryable: false,
      text: copy.validationErrorText,
      title: copy.validationErrorTitle,
    };
  }

  if (payload.error?.code === 'RATE_LIMITED') {
    return {
      retryable: true,
      text: copy.rateLimitText,
      title: copy.rateLimitTitle,
    };
  }

  return {
    retryable: true,
    text: copy.networkErrorText,
    title: copy.networkErrorTitle,
  };
}

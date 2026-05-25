'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';

import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  SearchIcon,
} from '@/components/ui/icons';
import { shouldUseUnoptimizedImage } from '@/lib/cms/media';
import type { Locale } from '@/lib/i18n/locale';
import { resolveSearchNavigationHref } from '@/lib/search/directNavigation';
import {
  searchRequestTypes,
  type SearchHit,
  type SearchRequestType,
  type SearchResponse,
} from '@/lib/search/types';

type SearchTypeLabels = Record<SearchRequestType, string>;

export type SearchResultsCopy = Readonly<{
  allCategories: string;
  categoryLabel: string;
  clear: string;
  clearFilters: string;
  contentTypeLabel: string;
  emptyText: string;
  emptyTitle: string;
  filtersLabel: string;
  loading: string;
  loadingShort: string;
  networkErrorText: string;
  networkErrorTitle: string;
  noResultsText: string;
  noResultsTitle: string;
  openResult: string;
  pageLabel: string;
  paginationNext: string;
  paginationPrevious: string;
  placeholder: string;
  popular: string;
  queryLabel: string;
  rateLimitText: string;
  rateLimitTitle: string;
  recent: string;
  resultCount: string;
  resultsFor: string;
  retry: string;
  searchLabel: string;
  submit: string;
  typeLabels: SearchTypeLabels;
  validationErrorText: string;
  validationErrorTitle: string;
}>;

type SearchResultsPageProps = Readonly<{
  copy: SearchResultsCopy;
  hotTerms: readonly string[];
  locale: Locale;
}>;

type SearchApiErrorResponse = Readonly<{
  error?: {
    code?: string;
    message?: string;
  };
  ok: false;
}>;

type SearchApiPayload = SearchResponse | SearchApiErrorResponse;

type SearchUrlState = Readonly<{
  category: string;
  hitsPerPage: number;
  page: number;
  q: string;
  type: SearchRequestType;
}>;

type UiError = Readonly<{
  retryable: boolean;
  text: string;
  title: string;
}>;

type SearchUrlPatch = Readonly<{
  category?: string | null;
  page?: number;
  q?: string;
  type?: SearchRequestType;
}>;

const defaultHitsPerPage = 8;
const maxQueryLength = 80;
const recentSearchLimit = 5;

function isSearchRequestType(value: string | null): value is SearchRequestType {
  return searchRequestTypes.includes(value as SearchRequestType);
}

function readPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readSearchUrlState(searchParams: Pick<URLSearchParams, 'get'>): SearchUrlState {
  const type = searchParams.get('type');

  return {
    category: searchParams.get('category') ?? '',
    hitsPerPage: readPositiveInteger(searchParams.get('hitsPerPage'), defaultHitsPerPage),
    page: readPositiveInteger(searchParams.get('page'), 1),
    q: searchParams.get('q') ?? '',
    type: isSearchRequestType(type) ? type : 'all',
  };
}

function compactSearchTerms(value: string) {
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

function paginationPages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const first = Math.max(1, Math.min(currentPage - 2, totalPages - 4));

  return Array.from({ length: 5 }, (_, index) => first + index);
}

function safeInternalHref(url: string) {
  return url.startsWith('/') ? url : '/';
}

function SearchSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded border border-border bg-white p-5 shadow-sm md:grid-cols-[132px_1fr]"
        >
          <div className="h-32 animate-pulse rounded bg-bg-light" />
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

function SearchTermButton({
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

function recommendedProductsTitle(locale: Locale, productLabel: string) {
  if (locale === 'zh') {
    return `推荐${productLabel}`;
  }

  if (locale === 'ru') {
    return `Рекомендуемые ${productLabel.toLocaleLowerCase()}`;
  }

  return `Recommended ${productLabel.toLocaleLowerCase()}`;
}

function SearchPrompt({
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
    </div>
  );
}

function SearchErrorNotice({
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

function SearchHitCard({
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
    <article className="group grid gap-4 rounded border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg md:grid-cols-[132px_1fr]">
      <Link
        className="relative block aspect-[4/3] overflow-hidden rounded bg-bg-light"
        href={safeInternalHref(hit.url)}
        aria-label={`${copy.openResult}: ${hit.title}`}
        onClick={() => onOpenResult(hit)}
      >
        {hit.image ? (
          <Image
            className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
            src={hit.image}
            alt=""
            fill
            sizes="132px"
            unoptimized={shouldUseUnoptimizedImage(hit.image)}
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm font-bold uppercase tracking-[0.12em] text-text-lighter">
            {copy.typeLabels[hit.type]}
          </span>
        )}
      </Link>

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

function selectedTypeCount(response: SearchResponse | null, type: SearchRequestType) {
  if (!response) {
    return 0;
  }

  if (type === 'all') {
    return response.totalHits;
  }

  return response.facets.types[type];
}

function errorFromPayload(payload: SearchApiErrorResponse, copy: SearchResultsCopy): UiError {
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

export function SearchResultsPage({ copy, hotTerms, locale }: SearchResultsPageProps) {
  const inputId = useId();
  const pathname = usePathname() ?? `/${locale}/search`;
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedSearchParams = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);
  const urlState = useMemo(() => readSearchUrlState(resolvedSearchParams), [resolvedSearchParams]);
  const [draftQuery, setDraftQuery] = useState(urlState.q);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<UiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const recentStorageKey = `yourfield:search:recent:${locale}`;
  const hasQuery = compactSearchTerms(urlState.q).length > 0;

  const updateUrl = useCallback(
    (patch: SearchUrlPatch) => {
      const next = new URLSearchParams(resolvedSearchParams.toString());
      const nextQuery = patch.q !== undefined ? compactSearchTerms(patch.q) : urlState.q;
      const nextType = patch.type ?? urlState.type;

      if (patch.q !== undefined) {
        if (nextQuery) {
          next.set('q', nextQuery);
        } else {
          next.delete('q');
        }
        next.delete('category');
        next.delete('type');
        next.delete('page');
      }

      if (patch.type !== undefined) {
        if (nextType === 'all') {
          next.delete('type');
        } else {
          next.set('type', nextType);
        }
        next.delete('page');
      }

      if (patch.category !== undefined) {
        if (patch.category) {
          next.set('category', patch.category);
        } else {
          next.delete('category');
        }
        next.delete('page');
      }

      if (patch.page !== undefined) {
        if (patch.page > 1) {
          next.set('page', String(patch.page));
        } else {
          next.delete('page');
        }
      }

      const queryString = next.toString();

      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [pathname, resolvedSearchParams, router, urlState.q, urlState.type],
  );

  const rememberSearch = useCallback(
    (query: string) => {
      const normalized = compactSearchTerms(query);

      if (!normalized) {
        return;
      }

      setRecentSearches((current) => {
        const next = [
          normalized,
          ...current.filter((item) => item.toLocaleLowerCase() !== normalized.toLocaleLowerCase()),
        ].slice(0, recentSearchLimit);

        try {
          window.localStorage.setItem(recentStorageKey, JSON.stringify(next));
        } catch {
          // Ignore storage failures; search itself should remain usable.
        }

        return next;
      });
    },
    [recentStorageKey],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(recentStorageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      const values = Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];

      setRecentSearches(values.slice(0, recentSearchLimit));
    } catch {
      setRecentSearches([]);
    }
  }, [recentStorageKey]);

  useEffect(() => {
    setDraftQuery(urlState.q);
  }, [urlState.q]);

  useEffect(() => {
    const controller = new AbortController();
    const apiParams = new URLSearchParams({
      hitsPerPage: String(urlState.hitsPerPage),
      locale,
      page: String(urlState.page),
      q: compactSearchTerms(urlState.q),
      type: urlState.type,
    });

    if (urlState.category) {
      apiParams.set('category', urlState.category);
    }

    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await fetch(`/api/search?${apiParams.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = (await result.json()) as SearchApiPayload;

        if (!result.ok || !payload.ok) {
          setResponse(null);
          setError(errorFromPayload(payload as SearchApiErrorResponse, copy));
          return;
        }

        setResponse(payload);

        if (payload.totalHits > 0) {
          rememberSearch(payload.query);
        }
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return;
        }

        setResponse(null);
        setError({
          retryable: true,
          text: copy.networkErrorText,
          title: copy.networkErrorTitle,
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [
    copy,
    locale,
    rememberSearch,
    reloadToken,
    urlState.category,
    urlState.hitsPerPage,
    urlState.page,
    urlState.q,
    urlState.type,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = compactSearchTerms(draftQuery);

    if (normalized.length > maxQueryLength) {
      setError({
        retryable: false,
        text: copy.validationErrorText,
        title: copy.validationErrorTitle,
      });
      setResponse(null);
      setIsLoading(false);
      return;
    }

    if (normalized) {
      setIsLoading(true);
      const directHref = await resolveSearchNavigationHref(locale, normalized);

      if (directHref) {
        router.push(directHref);
        return;
      }

      setIsLoading(false);
    }

    updateUrl({ q: normalized, type: 'all' });
  }

  const trackResultOpen = useCallback(
    (hit: SearchHit) => {
      if (!response || !compactSearchTerms(response.query)) {
        return;
      }

      void fetch('/api/search/click', {
        body: JSON.stringify({
          hits: response.totalHits,
          locale,
          query: response.query,
          result: {
            id: hit.id,
            title: hit.title,
            type: hit.type,
            url: safeInternalHref(hit.url),
          },
        }),
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true,
        method: 'POST',
      }).catch(() => {
        // Search click analytics must never block result navigation.
      });
    },
    [locale, response],
  );

  const categoryItems = Object.entries(response?.facets.categories ?? {}).sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0], locale);
  });
  const categoryLabels = new Map<string, string>();
  response?.hits.forEach((hit) => {
    if (hit.category?.id && hit.category.name) {
      categoryLabels.set(hit.category.id, hit.category.name);
    }
  });
  const pages = response
    ? paginationPages(response.pagination.page, response.pagination.totalPages)
    : [];

  return (
    <section className="bg-white py-14 md:py-20">
      <div className="container">
        <form
          className="grid gap-3 rounded border border-border bg-bg-light p-4 shadow-sm md:grid-cols-[1fr_auto] md:p-5"
          role="search"
          aria-label={copy.searchLabel}
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <label className="sr-only" htmlFor={inputId}>
            {copy.queryLabel}
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-current stroke-2 text-text-lighter" />
            <input
              id={inputId}
              className="focus:ring-accent/10 min-h-12 w-full rounded border border-border bg-white py-3 pl-12 pr-12 text-base font-semibold text-primary outline-none transition focus:border-accent focus:ring-4"
              type="search"
              name="q"
              autoComplete="off"
              value={draftQuery}
              placeholder={copy.placeholder}
              maxLength={maxQueryLength + 20}
              onChange={(event) => setDraftQuery(event.target.value)}
            />
            {draftQuery ? (
              <button
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-text-light hover:bg-bg-light hover:text-accent"
                type="button"
                aria-label={copy.clear}
                onClick={() => {
                  setDraftQuery('');
                  updateUrl({ q: '', type: 'all' });
                }}
              >
                <CloseIcon className="h-4 w-4 fill-none stroke-current stroke-2" />
              </button>
            ) : null}
          </div>
          <button className="btn btn-primary min-w-28" type="submit" disabled={isLoading}>
            {isLoading ? copy.loadingShort : copy.submit}
          </button>
        </form>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
          <aside
            className="rounded border border-border bg-bg-light p-5"
            aria-label={copy.filtersLabel}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-primary">{copy.filtersLabel}</h2>
              {(urlState.type !== 'all' || urlState.category) && hasQuery ? (
                <button
                  className="text-sm font-bold text-primary hover:text-accent"
                  type="button"
                  onClick={() => updateUrl({ category: null, page: 1, type: 'all' })}
                >
                  {copy.clearFilters}
                </button>
              ) : null}
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-primary">{copy.contentTypeLabel}</p>
              <div className="mt-3 grid gap-2">
                {searchRequestTypes.map((type) => (
                  <button
                    key={type}
                    className={[
                      'flex min-h-10 items-center justify-between rounded border px-3 py-2 text-left text-sm font-semibold transition',
                      urlState.type === type
                        ? 'border-accent bg-white text-accent'
                        : 'border-border bg-white text-primary hover:border-accent hover:text-accent',
                      !hasQuery || isLoading ? 'cursor-not-allowed opacity-60' : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    type="button"
                    aria-pressed={urlState.type === type}
                    disabled={!hasQuery || isLoading}
                    onClick={() => updateUrl({ page: 1, type })}
                  >
                    <span>{copy.typeLabels[type]}</span>
                    <span className="text-xs text-text-lighter">
                      {selectedTypeCount(response, type)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {categoryItems.length > 0 ? (
              <div className="mt-7">
                <p className="text-sm font-bold text-primary">{copy.categoryLabel}</p>
                <div className="mt-3 grid gap-2">
                  <button
                    className={[
                      'flex min-h-10 items-center justify-between rounded border px-3 py-2 text-left text-sm font-semibold transition',
                      !urlState.category
                        ? 'border-accent bg-white text-accent'
                        : 'border-border bg-white text-primary hover:border-accent hover:text-accent',
                      isLoading ? 'cursor-not-allowed opacity-60' : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    type="button"
                    aria-pressed={!urlState.category}
                    disabled={isLoading}
                    onClick={() => updateUrl({ category: null, page: 1 })}
                  >
                    {copy.allCategories}
                  </button>
                  {categoryItems.map(([category, count]) => (
                    <button
                      key={category}
                      className={[
                        'flex min-h-10 items-center justify-between rounded border px-3 py-2 text-left text-sm font-semibold transition',
                        urlState.category === category
                          ? 'border-accent bg-white text-accent'
                          : 'border-border bg-white text-primary hover:border-accent hover:text-accent',
                        isLoading ? 'cursor-not-allowed opacity-60' : undefined,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      type="button"
                      aria-pressed={urlState.category === category}
                      disabled={isLoading}
                      onClick={() => updateUrl({ category, page: 1 })}
                    >
                      <span className="truncate">{categoryLabels.get(category) ?? category}</span>
                      <span className="text-xs text-text-lighter">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>

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
              <SearchErrorNotice
                error={error}
                retryLabel={copy.retry}
                onRetry={() => setReloadToken((current) => current + 1)}
              />
            ) : null}

            {!isLoading && !error && response?.empty?.reason === 'EMPTY_QUERY' ? (
              <SearchPrompt
                copy={copy}
                hotTerms={hotTerms}
                onTermClick={(term) => updateUrl({ q: term, type: 'all' })}
                recentSearches={recentSearches}
              />
            ) : null}

            {!isLoading && !error && response?.empty?.reason === 'NO_RESULTS' ? (
              <div className="rounded border border-border bg-bg-light p-6 md:p-8">
                <h2 className="text-2xl font-bold text-primary">{copy.noResultsTitle}</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-text-light">
                  {copy.noResultsText}
                </p>
                <div className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-accent">
                    {copy.popular}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hotTerms.map((term) => (
                      <SearchTermButton
                        key={term}
                        onClick={(value) => updateUrl({ q: value, type: 'all' })}
                      >
                        {term}
                      </SearchTermButton>
                    ))}
                  </div>
                </div>

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
                          onOpenResult={trackResultOpen}
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
                      onOpenResult={trackResultOpen}
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
        </div>
      </div>
    </section>
  );
}

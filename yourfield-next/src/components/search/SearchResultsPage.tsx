'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useId, useMemo, useState } from 'react';

import { resolveSearchNavigationHref } from '@/lib/search/directNavigation';
import type { SearchHit, SearchResponse } from '@/lib/search/types';

import { SearchFilters } from './SearchFilters';
import { SearchForm } from './SearchForm';
import { SearchResultsPanel } from './SearchResultsPanel';
import type {
  SearchApiErrorResponse,
  SearchApiPayload,
  SearchResultsCopy,
  SearchUrlPatch,
  UiError,
} from './search-results-types';
import {
  compactSearchTerms,
  errorFromPayload,
  maxQueryLength,
  paginationPages,
  readSearchUrlState,
  recentSearchLimit,
  safeInternalHref,
} from './search-results-utils';

export type { SearchResultsCopy } from './search-results-types';

type SearchResultsPageProps = Readonly<{
  copy: SearchResultsCopy;
  hotTerms: readonly string[];
  locale: 'zh' | 'en' | 'ru';
}>;

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
  const categoryLabels = new Map(Object.entries(response?.facets.categoryLabels ?? {}));
  response?.hits.forEach((hit) => {
    if (hit.category?.id && hit.category.name && !categoryLabels.has(hit.category.id)) {
      categoryLabels.set(hit.category.id, hit.category.name);
    }
  });
  const pages = response
    ? paginationPages(response.pagination.page, response.pagination.totalPages)
    : [];

  return (
    <section className="bg-white py-14 md:py-20">
      <div className="container">
        <SearchForm
          copy={copy}
          draftQuery={draftQuery}
          inputId={inputId}
          isLoading={isLoading}
          onClear={() => {
            setDraftQuery('');
            updateUrl({ q: '', type: 'all' });
          }}
          onDraftQueryChange={setDraftQuery}
          onSubmit={handleSubmit}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
          <SearchFilters
            categoryItems={categoryItems}
            categoryLabels={categoryLabels}
            copy={copy}
            hasQuery={hasQuery}
            isLoading={isLoading}
            response={response}
            updateUrl={updateUrl}
            urlState={urlState}
          />

          <SearchResultsPanel
            copy={copy}
            error={error}
            hasQuery={hasQuery}
            hotTerms={hotTerms}
            isLoading={isLoading}
            locale={locale}
            onOpenResult={trackResultOpen}
            onRetry={() => setReloadToken((current) => current + 1)}
            onTermClick={(term) => updateUrl({ q: term, type: 'all' })}
            pages={pages}
            recentSearches={recentSearches}
            response={response}
            updateUrl={updateUrl}
            urlState={urlState}
          />
        </div>
      </div>
    </section>
  );
}

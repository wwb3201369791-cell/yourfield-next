import type { Locale } from '@/lib/i18n/locale';
import { categorySearchHrefFor } from '@/lib/search/categoryNavigation';
import {
  directSearchHitFor,
  directSearchHitsPerPage,
  safeDirectSearchHref,
} from '@/lib/search/direct';
import type { SearchResponse } from '@/lib/search/types';

type DirectSearchPayload = SearchResponse | Readonly<{ ok: false }>;

function compactSearchTerm(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export async function resolveDirectSearchHref(
  locale: Locale,
  query: string,
  options: Readonly<{ timeoutMs?: number }> = {},
) {
  return resolveSearchNavigationHref(locale, query, options);
}

export async function resolveSearchNavigationHref(
  locale: Locale,
  query: string,
  options: Readonly<{ timeoutMs?: number }> = {},
) {
  const normalizedQuery = compactSearchTerm(query);

  if (!normalizedQuery) {
    return null;
  }

  const categoryHref = categorySearchHrefFor(locale, normalizedQuery);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 1200);
  const params = new URLSearchParams({
    direct: '1',
    hitsPerPage: String(directSearchHitsPerPage),
    locale,
    page: '1',
    q: normalizedQuery,
    type: 'all',
  });

  if (categoryHref) {
    params.set('log', '1');
  }

  try {
    const response = await fetch(`/api/search?${params.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    const payload = (await response.json()) as DirectSearchPayload;

    if (!response.ok || !payload.ok) {
      return null;
    }

    return safeDirectSearchHref(directSearchHitFor(normalizedQuery, payload.hits)) ?? categoryHref;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }

    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

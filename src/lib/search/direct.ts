import type { SearchHit } from '@/lib/search/types';

export const directSearchHitsPerPage = 12;

export function normalizeDirectSearchTerm(value: string | undefined) {
  return (value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

function directSearchTerms(hit: SearchHit) {
  return [hit.title, hit.model, hit.sku, hit.productId].filter(
    (term): term is string => typeof term === 'string' && term.trim().length > 0,
  );
}

export function directSearchHitFor(query: string, hits: readonly SearchHit[]) {
  const normalizedQuery = normalizeDirectSearchTerm(query);

  if (!normalizedQuery) {
    return null;
  }

  return (
    hits.find((hit) =>
      directSearchTerms(hit).some((term) => normalizeDirectSearchTerm(term) === normalizedQuery),
    ) ?? null
  );
}

export function safeDirectSearchHref(hit: SearchHit | null) {
  return hit?.url.startsWith('/') ? hit.url : null;
}

import type { SearchRequestType, SearchResponse } from '@/lib/search/types';

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

export type SearchApiErrorResponse = Readonly<{
  error?: {
    code?: string;
    message?: string;
  };
  ok: false;
}>;

export type SearchApiPayload = SearchResponse | SearchApiErrorResponse;

export type SearchUrlState = Readonly<{
  category: string;
  hitsPerPage: number;
  page: number;
  q: string;
  type: SearchRequestType;
}>;

export type UiError = Readonly<{
  retryable: boolean;
  text: string;
  title: string;
}>;

export type SearchUrlPatch = Readonly<{
  category?: string | null;
  page?: number;
  q?: string;
  type?: SearchRequestType;
}>;

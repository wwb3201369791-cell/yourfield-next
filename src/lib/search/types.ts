export const searchLocales = ['zh', 'en', 'ru'] as const;
export type SearchLocale = (typeof searchLocales)[number];

export const searchHitTypes = [
  'product',
  'solution',
  'industry-case',
  'news',
  'page',
  'faq',
] as const;
export const searchRequestTypes = ['all', ...searchHitTypes] as const;
export type SearchRequestType = (typeof searchRequestTypes)[number];
export type SearchHitType = (typeof searchHitTypes)[number];

export type SearchQuery = Readonly<{
  category?: string;
  hitsPerPage: number;
  locale: SearchLocale;
  page: number;
  q: string;
  type: SearchRequestType;
}>;

export type SearchFieldErrors = Record<string, string[]>;

export type SearchParseResult =
  | Readonly<{ ok: true; value: SearchQuery }>
  | Readonly<{ error: { fields: SearchFieldErrors }; ok: false }>;

export type SearchHitCategory = Readonly<{
  id: string;
  name?: string;
}>;

export type SearchHit = Readonly<{
  category?: SearchHitCategory;
  excerpt: string;
  id: string;
  image?: string;
  model?: string;
  productId?: string;
  publishedAt?: string;
  score: number;
  sku?: string;
  slug?: string;
  title: string;
  type: SearchHitType;
  url: string;
}>;

export type SearchEmptyState = Readonly<{
  message: string;
  reason: 'EMPTY_QUERY' | 'NO_RESULTS';
}>;

export type SearchResponse = Readonly<{
  category?: string;
  empty?: SearchEmptyState;
  facets: {
    categories: Record<string, number>;
    categoryLabels?: Record<string, string>;
    types: Record<SearchHitType, number>;
  };
  hits: SearchHit[];
  locale: SearchLocale;
  ok: true;
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    hitsPerPage: number;
    page: number;
    totalPages: number;
  };
  query: string;
  recommendations?: {
    products: SearchHit[];
  };
  tookMs: number;
  totalHits: number;
  type: SearchRequestType;
}>;

export type SearchSuggestionType = SearchHitType | 'query';

export type SearchSuggestion = Readonly<{
  count?: number;
  term: string;
  type: SearchSuggestionType;
  url?: string;
}>;

export type SearchSuggestQuery = Readonly<{
  limit: number;
  locale: SearchLocale;
  q: string;
}>;

export type SearchSuggestParseResult =
  | Readonly<{ ok: true; value: SearchSuggestQuery }>
  | Readonly<{ error: { fields: SearchFieldErrors }; ok: false }>;

export type SearchClickRequest = Readonly<{
  hits: number;
  locale: SearchLocale;
  query: string;
  result: {
    id: string;
    title: string;
    type: SearchHitType;
    url: string;
  };
}>;

export type SearchClickParseResult =
  | Readonly<{ ok: true; value: SearchClickRequest }>
  | Readonly<{ error: { fields: SearchFieldErrors }; ok: false }>;

export type SearchSuggestResponse = Readonly<{
  locale: SearchLocale;
  ok: true;
  query: string;
  suggestions: SearchSuggestion[];
}>;

export type SearchSourceDocument = Record<string, unknown>;

export type SearchSources = Readonly<{
  faqs: readonly SearchSourceDocument[];
  industryCases: readonly SearchSourceDocument[];
  news: readonly SearchSourceDocument[];
  pages: readonly SearchSourceDocument[];
  products: readonly SearchSourceDocument[];
  solutions: readonly SearchSourceDocument[];
}>;

export type SearchSourceProvider = (input: SearchQuery) => Promise<SearchSources>;

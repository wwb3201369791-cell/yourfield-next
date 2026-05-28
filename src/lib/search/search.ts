// ADR: 当前站内搜索使用 Payload 数据源 + 本地候选构建/评分/摘要生成。
// 不再保留 Meilisearch 运行时依赖，避免本地服务、环境变量和真实查询路径不一致。

import type {
  SearchHit,
  SearchHitType,
  SearchQuery,
  SearchResponse,
  SearchSourceProvider,
  SearchSuggestion,
  SearchSuggestQuery,
  SearchSuggestResponse,
} from '@/lib/search/types';

import {
  recommendedProductHitsFromSources,
  toCandidates,
  type ScoredCandidate,
  type SearchCandidate,
  type SearchRecommendationsProvider,
} from './search-candidates';
import { scoreCandidate, searchTypeOrder } from './search-scoring';
import { snippetFor } from './search-snippets';
import { compact, normalizeKey, normalizeSearchText } from './search-text';

export { recommendedProductHitsFromSources };

const emptyQueryMessage = 'Enter a search term.';
const noResultsMessage = 'No matching content was found.';

function matchesType(candidate: SearchCandidate, type: SearchQuery['type']) {
  return type === 'all' || candidate.type === type;
}

function matchesCategory(candidate: SearchCandidate, category: string | undefined) {
  if (!category) {
    return true;
  }

  const normalizedCategory = normalizeKey(category);

  return candidate.categoryKeys.includes(normalizedCategory);
}

function toSearchHit({ candidate, score }: ScoredCandidate, query: string): SearchHit {
  return {
    ...(candidate.category ? { category: candidate.category } : {}),
    excerpt: snippetFor(candidate, query),
    id: candidate.id,
    ...(candidate.image ? { image: candidate.image } : {}),
    ...(candidate.model ? { model: candidate.model } : {}),
    ...(candidate.productId ? { productId: candidate.productId } : {}),
    ...(candidate.publishedAt ? { publishedAt: candidate.publishedAt } : {}),
    score: Number(score.toFixed(3)),
    ...(candidate.sku ? { sku: candidate.sku } : {}),
    ...(candidate.slug ? { slug: candidate.slug } : {}),
    title: candidate.title,
    type: candidate.type,
    url: candidate.url,
  };
}

const initialTypeCounts = {
  faq: 0,
  'industry-case': 0,
  news: 0,
  page: 0,
  product: 0,
  solution: 0,
} satisfies Record<SearchHitType, number>;

function emptyTypeCounts() {
  return { ...initialTypeCounts };
}

function defaultCategoryLabel(categoryId: string, locale: SearchQuery['locale']) {
  const labels: Record<string, Record<SearchQuery['locale'], string>> = {
    faq: { en: 'FAQ', ru: 'FAQ', zh: '常见问题' },
    'industry-case': { en: 'Industry cases', ru: 'Отраслевые кейсы', zh: '行业案例' },
    news: { en: 'News', ru: 'Новости', zh: '新闻' },
    solution: { en: 'Solutions', ru: 'Решения', zh: '解决方案' },
  };

  return labels[categoryId]?.[locale];
}

function facetCounts(scoredCandidates: readonly ScoredCandidate[], locale: SearchQuery['locale']) {
  const types = emptyTypeCounts();
  const categories: Record<string, number> = {};
  const categoryLabels: Record<string, string> = {};

  for (const { candidate } of scoredCandidates) {
    types[candidate.type] += 1;

    if (candidate.type !== 'product') {
      continue;
    }

    if (candidate.category?.id) {
      const categoryId = candidate.category.id;

      categories[categoryId] = (categories[categoryId] ?? 0) + 1;

      const label = candidate.category.name ?? defaultCategoryLabel(categoryId, locale);
      if (label && !categoryLabels[categoryId]) {
        categoryLabels[categoryId] = label;
      }
    }
  }

  return {
    categories,
    ...(Object.keys(categoryLabels).length > 0 ? { categoryLabels } : {}),
    types,
  };
}

function emptyResponse(input: SearchQuery, tookMs: number): SearchResponse {
  return {
    empty: { message: emptyQueryMessage, reason: 'EMPTY_QUERY' },
    facets: { categories: {}, types: emptyTypeCounts() },
    hits: [],
    locale: input.locale,
    ok: true,
    pagination: {
      hasNextPage: false,
      hasPreviousPage: false,
      hitsPerPage: input.hitsPerPage,
      page: input.page,
      totalPages: 0,
    },
    query: input.q,
    tookMs,
    totalHits: 0,
    type: input.type,
    ...(input.category ? { category: input.category } : {}),
  };
}

export async function searchContent(
  input: SearchQuery,
  sourceProvider: SearchSourceProvider,
  recommendationsProvider?: SearchRecommendationsProvider,
): Promise<SearchResponse> {
  const startedAt = Date.now();

  if (!input.q) {
    return emptyResponse(input, Date.now() - startedAt);
  }

  const sources = await sourceProvider(input);
  const allScoredCandidates = toCandidates(sources, input.locale)
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, input.q) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const typeOrder =
        searchTypeOrder[left.candidate.type] - searchTypeOrder[right.candidate.type];
      if (typeOrder !== 0) {
        return typeOrder;
      }

      return left.candidate.title.localeCompare(right.candidate.title, input.locale);
    });
  const scoredCandidates = allScoredCandidates
    .filter((candidate) => matchesType(candidate.candidate, input.type))
    .filter((candidate) => matchesCategory(candidate.candidate, input.category));

  const totalHits = scoredCandidates.length;
  const totalPages = totalHits === 0 ? 0 : Math.ceil(totalHits / input.hitsPerPage);
  const page = totalPages > 0 ? Math.min(input.page, totalPages) : input.page;
  const start = (page - 1) * input.hitsPerPage;
  const pagedHits = scoredCandidates
    .slice(start, start + input.hitsPerPage)
    .map((candidate) => toSearchHit(candidate, input.q));
  const recommendedProducts =
    totalHits === 0 && input.q && recommendationsProvider
      ? [...(await recommendationsProvider(input))].slice(0, 3)
      : [];

  return {
    ...(input.category ? { category: input.category } : {}),
    ...(totalHits === 0 ? { empty: { message: noResultsMessage, reason: 'NO_RESULTS' } } : {}),
    facets: facetCounts(allScoredCandidates, input.locale),
    hits: pagedHits,
    locale: input.locale,
    ok: true,
    pagination: {
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
      hitsPerPage: input.hitsPerPage,
      page,
      totalPages,
    },
    query: input.q,
    ...(recommendedProducts.length > 0
      ? { recommendations: { products: recommendedProducts } }
      : {}),
    tookMs: Date.now() - startedAt,
    totalHits,
    type: input.type,
  };
}

function searchUrl(locale: string, term: string) {
  const params = new URLSearchParams({ q: term });

  return `/${locale}/search?${params.toString()}`;
}

function hitSuggestionTerms(hit: SearchHit) {
  if (hit.type === 'product') {
    return compact([hit.model, hit.sku, hit.productId, hit.title]);
  }

  return [hit.title];
}

function addSuggestion(
  suggestions: SearchSuggestion[],
  seenTerms: Set<string>,
  suggestion: SearchSuggestion,
) {
  const normalizedTerm = normalizeSearchText(suggestion.term);

  if (!normalizedTerm || seenTerms.has(normalizedTerm)) {
    return;
  }

  seenTerms.add(normalizedTerm);
  suggestions.push(suggestion);
}

export async function suggestContent(
  input: SearchSuggestQuery,
  sourceProvider: SearchSourceProvider,
): Promise<SearchSuggestResponse> {
  const query = input.q.trim();

  if (!query) {
    return {
      locale: input.locale,
      ok: true,
      query,
      suggestions: [],
    };
  }

  const response = await searchContent(
    {
      hitsPerPage: Math.max(input.limit, 1),
      locale: input.locale,
      page: 1,
      q: query,
      type: 'all',
    },
    sourceProvider,
  );
  const normalizedQuery = normalizeSearchText(query);
  const suggestions: SearchSuggestion[] = [];
  const seenTerms = new Set<string>();

  for (const hit of response.hits) {
    for (const term of hitSuggestionTerms(hit)) {
      if (!normalizeSearchText(term).includes(normalizedQuery)) {
        continue;
      }

      addSuggestion(suggestions, seenTerms, {
        term,
        type: hit.type,
        url: hit.url,
      });

      if (suggestions.length >= input.limit) {
        break;
      }
    }

    if (suggestions.length >= input.limit) {
      break;
    }
  }

  if (suggestions.length < input.limit && response.totalHits > 0) {
    addSuggestion(suggestions, seenTerms, {
      count: response.totalHits,
      term: query,
      type: 'query',
      url: searchUrl(input.locale, query),
    });
  }

  return {
    locale: input.locale,
    ok: true,
    query,
    suggestions: suggestions.slice(0, input.limit),
  };
}

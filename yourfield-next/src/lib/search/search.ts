import type {
  SearchHit,
  SearchHitCategory,
  SearchHitType,
  SearchQuery,
  SearchResponse,
  SearchSuggestion,
  SearchSuggestQuery,
  SearchSuggestResponse,
  SearchSourceDocument,
  SearchSourceProvider,
} from '@/lib/search/types';

type WeightedField = Readonly<{
  text: string;
  weight: number;
}>;

type SearchCandidate = Readonly<{
  category?: SearchHitCategory;
  categoryKeys: readonly string[];
  excerpt: string;
  fields: readonly WeightedField[];
  id: string;
  image?: string;
  model?: string;
  productId?: string;
  publishedAt?: string;
  sku?: string;
  slug?: string;
  title: string;
  type: SearchHitType;
  url: string;
}>;

type ScoredCandidate = Readonly<{
  candidate: SearchCandidate;
  score: number;
}>;

type SearchRecommendationsProvider = (
  input: SearchQuery,
) => Promise<readonly SearchHit[]> | readonly SearchHit[];

const emptyQueryMessage = 'Enter a search term.';
const noResultsMessage = 'No matching content was found.';
const maxSnippetLength = 180;

const searchTypeOrder: Record<SearchHitType, number> = {
  product: 0,
  news: 1,
  page: 2,
  faq: 3,
};

const pageKeyPaths: Record<string, string> = {
  about: '/about',
  contact: '/contact',
  cookies: '/cookies',
  franchise: '/franchise',
  home: '',
  'news-index': '/news',
  privacy: '/privacy',
  'products-index': '/products',
  solutions: '/solutions',
  terms: '/terms',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (isRecord(item)) {
        return asString(item.value) || asString(item.text) || asString(item.label);
      }

      return '';
    })
    .filter((item) => item.length > 0);
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function richTextToPlainText(value: unknown) {
  const parts: string[] = [];

  function walk(node: unknown, depth: number) {
    if (depth > 24 || !node) {
      return;
    }

    if (typeof node === 'string') {
      parts.push(node);
      return;
    }

    if (Array.isArray(node)) {
      for (const child of node) {
        walk(child, depth + 1);
      }
      return;
    }

    if (!isRecord(node)) {
      return;
    }

    const text = node.text;
    if (typeof text === 'string') {
      parts.push(text);
    }

    walk(node.root, depth + 1);
    walk(node.children, depth + 1);
  }

  walk(value, 0);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function collectPublicText(value: unknown) {
  const parts: string[] = [];
  const skippedKeys = new Set([
    'backgroundImage',
    'backgroundVideo',
    'cover',
    'createdAt',
    'file',
    'filename',
    'id',
    'image',
    'images',
    'mimeType',
    'ogImage',
    'updatedAt',
    'url',
    'video',
  ]);

  function walk(node: unknown, depth: number, keyHint?: string) {
    if (depth > 10 || !node) {
      return;
    }

    if (typeof node === 'string') {
      if (
        keyHint !== 'href' &&
        keyHint !== 'ctaHref' &&
        keyHint !== 'primaryHref' &&
        keyHint !== 'secondaryHref'
      ) {
        parts.push(node);
      }
      return;
    }

    if (Array.isArray(node)) {
      for (const child of node) {
        walk(child, depth + 1, keyHint);
      }
      return;
    }

    if (!isRecord(node)) {
      return;
    }

    if ('root' in node || 'children' in node) {
      const richText = richTextToPlainText(node);
      if (richText) {
        parts.push(richText);
      }
    }

    for (const [key, child] of Object.entries(node)) {
      if (skippedKeys.has(key)) {
        continue;
      }

      walk(child, depth + 1, key);
    }
  }

  walk(value, 0);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function compact(values: readonly (string | undefined)[]) {
  return values.filter((value): value is string => Boolean(value && value.trim()));
}

function normalizeSearchText(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeKey(value: string) {
  return normalizeSearchText(value).replace(/\s+/g, '-');
}

function tokenizeQuery(query: string) {
  const normalized = normalizeSearchText(query);
  const words = normalized.match(/[\p{L}\p{N}]+/gu) ?? [];
  const tokens = new Set<string>();

  if (normalized) {
    tokens.add(normalized);
  }

  for (const word of words) {
    if (word) {
      tokens.add(word);
    }
  }

  return Array.from(tokens);
}

function scoreField(field: WeightedField, normalizedQuery: string, tokens: readonly string[]) {
  const text = normalizeSearchText(field.text);

  if (!text) {
    return 0;
  }

  let score = 0;

  if (text === normalizedQuery) {
    score += field.weight * 50;
  } else if (text.startsWith(normalizedQuery)) {
    score += field.weight * 24;
  } else if (text.includes(normalizedQuery)) {
    score += field.weight * 16;
  }

  for (const token of tokens) {
    if (!token || token === normalizedQuery) {
      continue;
    }

    if (text === token) {
      score += field.weight * 12;
    } else if (text.startsWith(token)) {
      score += field.weight * 6;
    } else if (text.includes(token)) {
      score += field.weight * 4;
    }
  }

  return score;
}

function scoreCandidate(candidate: SearchCandidate, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeQuery(query);

  return candidate.fields.reduce(
    (score, field) => score + scoreField(field, normalizedQuery, tokens),
    0,
  );
}

function truncate(value: string, maxLength = maxSnippetLength) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function snippetFor(candidate: SearchCandidate, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeQuery(query);
  const match = candidate.fields.find((field) => {
    const text = normalizeSearchText(field.text);

    return text.includes(normalizedQuery) || tokens.some((token) => token && text.includes(token));
  });

  return truncate(match?.text || candidate.excerpt || candidate.title);
}

function pagePath(locale: string, page: SearchSourceDocument) {
  const pageKey = asString(page.pageKey);
  const slug = asString(page.slug);
  const path = pageKeyPaths[pageKey] ?? (slug ? `/${slug}` : '');

  return `/${locale}${path}`;
}

function mediaUrl(value: unknown) {
  if (!isRecord(value)) {
    return undefined;
  }

  const sizes = readRecord(value.sizes);
  const card = readRecord(sizes?.card);

  return asString(card?.url) || asString(value.url) || undefined;
}

function productImage(product: SearchSourceDocument) {
  const images: unknown[] = Array.isArray(product.images) ? product.images : [];
  const firstImage: unknown = images[0];
  const imageRecord = readRecord(firstImage);

  return mediaUrl(imageRecord?.file) || mediaUrl(firstImage);
}

function productCandidate(product: SearchSourceDocument, locale: string): SearchCandidate {
  const category = readRecord(product.category);
  const productId = asString(product.productId);
  const slug = asString(product.slug, productId);
  const model = asString(product.model);
  const sku = asString(product.sku);
  const title = asString(product.name, model || sku || productId || slug);
  const description = richTextToPlainText(product.description);
  const categoryId = asString(category?.categoryId);
  const categorySlug = asString(category?.slug);
  const categoryGroup = asString(category?.group);
  const categoryName = asString(category?.name);
  const categoryKeys = compact([categoryId, categorySlug, categoryGroup, categoryName]).map(
    normalizeKey,
  );
  const tags = asStringArray(product.tags).join(' ');
  const standards = asStringArray(product.standards).join(' ');
  const materials = asStringArray(product.materials).join(' ');
  const applications = asStringArray(product.applications).join(' ');
  const features = collectPublicText(product.features);
  const specifications = collectPublicText(product.specifications);
  const image = productImage(product);
  const hitCategory = categoryId
    ? {
        id: categoryId,
        ...(categoryName ? { name: categoryName } : {}),
      }
    : undefined;

  return {
    ...(hitCategory ? { category: hitCategory } : {}),
    categoryKeys,
    excerpt: truncate(description || compact([model, sku, categoryName]).join(' ') || title),
    fields: [
      { text: title, weight: 3 },
      { text: model, weight: 3 },
      { text: sku, weight: 3 },
      { text: productId, weight: 3 },
      { text: description, weight: 1 },
      { text: tags, weight: 1.5 },
      { text: standards, weight: 1 },
      { text: categoryName, weight: 1.5 },
      { text: materials, weight: 1 },
      { text: applications, weight: 1 },
      { text: features, weight: 1 },
      { text: specifications, weight: 1 },
    ],
    id: `product:${asString(product.id, slug)}`,
    ...(image ? { image } : {}),
    ...(model ? { model } : {}),
    ...(productId ? { productId } : {}),
    ...(sku ? { sku } : {}),
    slug,
    title,
    type: 'product',
    url: `/${locale}/products/${slug}`,
  };
}

function newsCandidate(item: SearchSourceDocument, locale: string): SearchCandidate {
  const slug = asString(item.slug);
  const title = asString(item.title, slug);
  const content = richTextToPlainText(item.content);
  const excerpt = asString(item.excerpt, content || title);
  const categoryId = asString(item.category, 'news');
  const tags = asStringArray(item.tags).join(' ');
  const image = mediaUrl(item.cover);
  const publishedAt = asString(item.publishedAt);

  return {
    category: { id: categoryId },
    categoryKeys: [normalizeKey(categoryId)],
    excerpt: truncate(excerpt),
    fields: [
      { text: title, weight: 3 },
      { text: excerpt, weight: 1.5 },
      { text: content, weight: 1 },
      { text: tags, weight: 1.2 },
      { text: categoryId, weight: 0.5 },
    ],
    id: `news:${asString(item.id, slug)}`,
    ...(image ? { image } : {}),
    ...(publishedAt ? { publishedAt } : {}),
    slug,
    title,
    type: 'news',
    url: `/${locale}/news/${slug}`,
  };
}

function pageCandidate(page: SearchSourceDocument, locale: string): SearchCandidate {
  const slug = asString(page.slug);
  const pageKey = asString(page.pageKey);
  const title = asString(page.title, pageKey || slug);
  const hero = readRecord(page.hero);
  const seo = readRecord(page.seo);
  const blocksText = collectPublicText(page.blocks);
  const heroText = compact([asString(hero?.title), asString(hero?.subtitle)]).join(' ');
  const seoText = compact([asString(seo?.title), asString(seo?.description)]).join(' ');
  const content = compact([heroText, blocksText, seoText]).join(' ');

  return {
    categoryKeys: [],
    excerpt: truncate(content || title),
    fields: [
      { text: title, weight: 3 },
      { text: heroText, weight: 1.5 },
      { text: blocksText, weight: 1 },
      { text: seoText, weight: 0.5 },
      { text: pageKey, weight: 0.5 },
    ],
    id: `page:${asString(page.id, pageKey || slug || 'home')}`,
    ...(slug ? { slug } : {}),
    title,
    type: 'page',
    url: pagePath(locale, page),
  };
}

function referenceUrl(locale: string, prefix: string, value: unknown) {
  const ref = readRecord(value);
  const slug = asString(ref?.slug);

  return slug ? `/${locale}/${prefix}/${slug}` : undefined;
}

function faqCandidate(faq: SearchSourceDocument, locale: string): SearchCandidate {
  const question = asString(faq.question);
  const answer = richTextToPlainText(faq.answer);
  const scope = asString(faq.scope, 'global');
  const tags = asStringArray(faq.tags).join(' ');
  const url =
    referenceUrl(locale, 'products', faq.productRef) ||
    referenceUrl(locale, 'news', faq.newsRef) ||
    pagePath(locale, readRecord(faq.pageRef) ?? {}) ||
    `/${locale}`;

  return {
    category: { id: scope },
    categoryKeys: [normalizeKey(scope)],
    excerpt: truncate(answer || question),
    fields: [
      { text: question, weight: 3 },
      { text: answer, weight: 1 },
      { text: tags, weight: 0.8 },
      { text: scope, weight: 0.5 },
    ],
    id: `faq:${asString(faq.id, question)}`,
    title: question || truncate(answer, 80) || 'FAQ',
    type: 'faq',
    url,
  };
}

function toCandidates(sources: Awaited<ReturnType<SearchSourceProvider>>, locale: string) {
  return [
    ...sources.products.map((product) => productCandidate(product, locale)),
    ...sources.news.map((item) => newsCandidate(item, locale)),
    ...sources.pages.map((page) => pageCandidate(page, locale)),
    ...sources.faqs.map((faq) => faqCandidate(faq, locale)),
  ];
}

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

function toRecommendedProductHit(candidate: SearchCandidate): SearchHit {
  return {
    ...(candidate.category ? { category: candidate.category } : {}),
    excerpt: candidate.excerpt,
    id: candidate.id,
    ...(candidate.image ? { image: candidate.image } : {}),
    ...(candidate.model ? { model: candidate.model } : {}),
    ...(candidate.productId ? { productId: candidate.productId } : {}),
    ...(candidate.publishedAt ? { publishedAt: candidate.publishedAt } : {}),
    score: 0,
    ...(candidate.sku ? { sku: candidate.sku } : {}),
    ...(candidate.slug ? { slug: candidate.slug } : {}),
    title: candidate.title,
    type: 'product',
    url: candidate.url,
  };
}

export function recommendedProductHitsFromSources(
  sources: Pick<Awaited<ReturnType<SearchSourceProvider>>, 'products'>,
  locale: string,
  limit: number,
) {
  return sources.products
    .map((product) => productCandidate(product, locale))
    .sort((left, right) => left.title.localeCompare(right.title, locale))
    .slice(0, Math.max(0, limit))
    .map(toRecommendedProductHit);
}

function facetCounts(scoredCandidates: readonly ScoredCandidate[]) {
  const types = {
    faq: 0,
    news: 0,
    page: 0,
    product: 0,
  } satisfies Record<SearchHitType, number>;
  const categories: Record<string, number> = {};

  for (const { candidate } of scoredCandidates) {
    types[candidate.type] += 1;

    if (candidate.category?.id) {
      categories[candidate.category.id] = (categories[candidate.category.id] ?? 0) + 1;
    }
  }

  return { categories, types };
}

function emptyResponse(input: SearchQuery, tookMs: number): SearchResponse {
  return {
    empty: { message: emptyQueryMessage, reason: 'EMPTY_QUERY' },
    facets: { categories: {}, types: { faq: 0, news: 0, page: 0, product: 0 } },
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
  const scoredCandidates = toCandidates(sources, input.locale)
    .filter((candidate) => matchesType(candidate, input.type))
    .filter((candidate) => matchesCategory(candidate, input.category))
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
    facets: facetCounts(scoredCandidates),
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

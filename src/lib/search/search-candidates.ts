import type {
  SearchHit,
  SearchHitCategory,
  SearchHitType,
  SearchQuery,
  SearchSourceDocument,
  SearchSourceProvider,
} from '@/lib/search/types';

import {
  asString,
  asStringArray,
  collectPublicText,
  compact,
  normalizeKey,
  readRecord,
  richTextToPlainText,
  truncate,
} from './search-text';

export type WeightedField = Readonly<{
  text: string;
  weight: number;
}>;

export type SearchCandidate = Readonly<{
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

export type ScoredCandidate = Readonly<{
  candidate: SearchCandidate;
  score: number;
}>;

export type SearchRecommendationsProvider = (
  input: SearchQuery,
) => Promise<readonly SearchHit[]> | readonly SearchHit[];

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

function pagePath(locale: string, page: SearchSourceDocument) {
  const pageKey = asString(page.pageKey);
  const slug = asString(page.slug);
  const path = pageKeyPaths[pageKey] ?? (slug ? `/${slug}` : '');

  return `/${locale}${path}`;
}

function mediaUrl(value: unknown) {
  if (!readRecord(value)) {
    return undefined;
  }

  const record = readRecord(value);
  const sizes = readRecord(record?.sizes);
  const card = readRecord(sizes?.card);

  return asString(card?.url) || asString(record?.url) || undefined;
}

function productImage(product: SearchSourceDocument) {
  const images: unknown[] = Array.isArray(product.images) ? product.images : [];
  const firstImage: unknown = images[0];
  const imageRecord = readRecord(firstImage);

  return mediaUrl(imageRecord?.file) || mediaUrl(firstImage);
}

function productCandidate(product: SearchSourceDocument, locale: string): SearchCandidate {
  const category = readRecord(product.category);
  const seo = readRecord(product.seo);
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
  const seoTitle = asString(seo?.title);
  const seoDescription = asString(seo?.description);
  const seoKeywords = asString(seo?.keywords);
  const seoText = compact([seoTitle, seoDescription, seoKeywords]).join(' ');
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
      { text: seoText, weight: 0.6 },
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
  const seo = readRecord(item.seo);
  const slug = asString(item.slug);
  const title = asString(item.title, slug);
  const content = richTextToPlainText(item.content);
  const excerpt = asString(item.excerpt, content || title);
  const categoryId = asString(item.category, 'news');
  const tags = asStringArray(item.tags).join(' ');
  const seoTitle = asString(seo?.title);
  const seoDescription = asString(seo?.description);
  const seoKeywords = asString(seo?.keywords);
  const seoText = compact([seoTitle, seoDescription, seoKeywords]).join(' ');
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
      { text: seoText, weight: 0.6 },
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
  const seoText = compact([
    asString(seo?.title),
    asString(seo?.description),
    asString(seo?.keywords),
  ]).join(' ');
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

function solutionCandidate(solution: SearchSourceDocument, locale: string): SearchCandidate {
  const slug = asString(solution.slug, asString(solution.solutionId));
  const title = asString(solution.title, slug || 'Solution');
  const summary = asString(solution.summary) || richTextToPlainText(solution.content) || title;
  const features = asStringArray(solution.features).join(' ');
  const productTags = asStringArray(solution.productTags).join(' ');
  const image = mediaUrl(solution.cover) || asString(solution.image);

  return {
    category: { id: 'solution' },
    categoryKeys: [normalizeKey('solution'), normalizeKey(slug)],
    excerpt: truncate(summary),
    fields: [
      { text: title, weight: 3 },
      { text: summary, weight: 1.5 },
      { text: features, weight: 1 },
      { text: productTags, weight: 1.2 },
      { text: slug, weight: 0.8 },
    ],
    id: `solution:${asString(solution.id, slug)}`,
    ...(image ? { image } : {}),
    ...(slug ? { slug } : {}),
    title,
    type: 'solution',
    url: `/${locale}/solutions${slug ? `#${slug}` : ''}`,
  };
}

function industryCaseCandidate(item: SearchSourceDocument, locale: string): SearchCandidate {
  const id = asString(item.id);
  const anchor = asString(item.anchor, id);
  const title = asString(item.title, id || 'Industry case');
  const text = asString(item.text, title);
  const meta = asString(item.meta);
  const image = asString(item.image);
  const href = asString(item.href);

  return {
    category: { id: 'industry-case', ...(meta ? { name: meta } : {}) },
    categoryKeys: [normalizeKey('industry-case'), normalizeKey(anchor), normalizeKey(meta)],
    excerpt: truncate(text),
    fields: [
      { text: title, weight: 3 },
      { text, weight: 1.5 },
      { text: meta, weight: 1.2 },
      { text: anchor, weight: 0.8 },
      { text: id, weight: 0.5 },
    ],
    id: `industry-case:${id || anchor || title}`,
    ...(image ? { image } : {}),
    title,
    type: 'industry-case',
    url: href || `/${locale}/products${anchor ? `#${anchor}` : ''}`,
  };
}

export function toCandidates(sources: Awaited<ReturnType<SearchSourceProvider>>, locale: string) {
  return [
    ...sources.products.map((product) => productCandidate(product, locale)),
    ...sources.solutions.map((solution) => solutionCandidate(solution, locale)),
    ...sources.industryCases.map((item) => industryCaseCandidate(item, locale)),
    ...sources.news.map((item) => newsCandidate(item, locale)),
    ...sources.pages.map((page) => pageCandidate(page, locale)),
    ...sources.faqs.map((faq) => faqCandidate(faq, locale)),
  ];
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

import { z } from 'zod';

import { cmsCollectionCacheTag, cmsGlobalCacheTag } from '@/lib/cms/cache';

const localeValues = ['zh', 'en', 'ru'] as const;
const collectionValues = [
  'pages',
  'product-groups',
  'products',
  'product-categories',
  'solutions',
  'news',
  'faqs',
] as const;
const globalValues = ['navigation', 'site-settings'] as const;
const operationValues = [
  'create',
  'update',
  'publish',
  'unpublish',
  'delete',
  'config-change',
] as const;
const pageKeyValues = [
  'home',
  'about',
  'products-index',
  'solutions',
  'news-index',
  'franchise',
  'contact',
  'privacy',
  'cookies',
  'terms',
] as const;

const safeSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const safePathPattern = /^\/(?:zh|en|ru)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const safeTagPattern = /^[A-Za-z0-9:_./-]{1,128}$/;
const safeDocumentIdPattern = /^[A-Za-z0-9:_-]{1,128}$/;

const fixedPagePathByKey = {
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
} as const satisfies Record<PageKey, string>;

const pageKeyBySlug = new Map<string, PageKey>(
  Object.entries(fixedPagePathByKey)
    .filter(([, path]) => path.length > 0)
    .map(([pageKey, path]) => [path.slice(1), pageKey as PageKey]),
);

const fixedPublicPathSuffixes = Object.values(fixedPagePathByKey);

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
};

const optionalSlugSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().max(160).regex(safeSlugPattern).optional(),
);

const safePathSchema = z
  .string()
  .trim()
  .max(512)
  .refine(
    (value) => isSafeRevalidationPath(value),
    'Path must be an internal localized public path.',
  );

const safeTagSchema = z
  .string()
  .trim()
  .max(128)
  .regex(safeTagPattern, 'Tag contains unsupported characters.');

const documentIdSchema = z.preprocess((value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed || undefined;
  }

  return value;
}, z.string().regex(safeDocumentIdPattern).optional());

const relationRefSchema = z
  .union([
    z.string().max(160),
    z.number(),
    z
      .object({
        id: documentIdSchema,
        pageKey: z.enum(pageKeyValues).optional(),
        slug: optionalSlugSchema,
      })
      .passthrough(),
  ])
  .optional();

export const revalidateRequestSchema = z
  .object({
    categoryId: optionalSlugSchema,
    collection: z.enum(collectionValues).optional(),
    documentId: documentIdSchema,
    global: z.enum(globalValues).optional(),
    newsRef: relationRefSchema,
    operation: z.enum(operationValues).default('update'),
    pageKey: z.enum(pageKeyValues).optional(),
    pageRef: relationRefSchema,
    paths: z.array(safePathSchema).max(50).optional(),
    productRef: relationRefSchema,
    scope: z.enum(['global', 'page', 'product', 'news']).optional(),
    slug: optionalSlugSchema,
    tags: z.array(safeTagSchema).max(50).optional(),
  })
  .strip()
  .superRefine((value, context) => {
    const hasExplicitTargets = Boolean(value.paths?.length || value.tags?.length);

    if (value.collection && value.global) {
      context.addIssue({
        code: 'custom',
        message: 'Use either collection or global, not both.',
        path: ['collection'],
      });
    }

    if (!hasExplicitTargets && !value.collection && !value.global) {
      context.addIssue({
        code: 'custom',
        message: 'Provide paths/tags or a collection/global source.',
        path: ['paths'],
      });
    }
  });

export type RevalidateCollectionSlug = (typeof collectionValues)[number];
export type RevalidateGlobalSlug = (typeof globalValues)[number];
export type RevalidateOperation = (typeof operationValues)[number];
export type PageKey = (typeof pageKeyValues)[number];
export type RevalidateInput = z.infer<typeof revalidateRequestSchema>;
export type RevalidateDocument = Record<string, unknown>;

export type RevalidationSkip = Readonly<{
  reason: string;
  target: string;
}>;

export type RevalidationTargets = Readonly<{
  paths: string[];
  skipped: RevalidationSkip[];
  tags: string[];
}>;

export type RevalidationTargetOptions = Readonly<{
  findDocument?: (
    collection: RevalidateCollectionSlug,
    documentId: string,
  ) => Promise<RevalidateDocument | null>;
}>;

type RelationInfo = Readonly<{
  id?: string;
  pageKey?: PageKey;
  slug?: string;
}>;

export function isSafeSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 160 && safeSlugPattern.test(value);
}

export function isSafeRevalidationPath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 512) {
    return false;
  }

  if (!safePathPattern.test(value)) {
    return false;
  }

  return !value.includes('..') && !value.includes('\\') && !value.includes('//');
}

function localizedPaths(pathSuffix: string) {
  return localeValues.map((locale) => (pathSuffix ? `/${locale}${pathSuffix}` : `/${locale}`));
}

function addPaths(pathSet: Set<string>, pathSuffixes: readonly string[]) {
  for (const suffix of pathSuffixes) {
    for (const path of localizedPaths(suffix)) {
      if (isSafeRevalidationPath(path)) {
        pathSet.add(path);
      }
    }
  }
}

function addTags(tagSet: Set<string>, tags: readonly string[] | undefined) {
  for (const tag of tags ?? []) {
    tagSet.add(tag);
  }
}

function textFrom(source: unknown, key: string) {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  const value = (source as Record<string, unknown>)[key];

  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function pageKeyFrom(source: unknown) {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  const value = (source as Record<string, unknown>).pageKey;

  return typeof value === 'string' && pageKeyValues.includes(value as PageKey)
    ? (value as PageKey)
    : undefined;
}

function relationInfoFrom(value: unknown): RelationInfo {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { id: String(value) };
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return {};
    }

    return isSafeSlug(trimmed) ? { id: trimmed, slug: trimmed } : { id: trimmed };
  }

  if (!value || typeof value !== 'object') {
    return {};
  }

  const record = value as Record<string, unknown>;
  const id = typeof record.id === 'number' ? String(record.id) : textFrom(record, 'id');
  const slug = textFrom(record, 'slug');
  const pageKey = pageKeyFrom(record);

  return {
    ...(id ? { id } : {}),
    ...(isSafeSlug(slug) ? { slug } : {}),
    ...(pageKey ? { pageKey } : {}),
  };
}

function pagePathFrom(pageKey: PageKey | undefined, slug: string | undefined) {
  if (pageKey) {
    return fixedPagePathByKey[pageKey];
  }

  if (!slug) {
    return undefined;
  }

  const slugPageKey = pageKeyBySlug.get(slug);

  return slugPageKey ? fixedPagePathByKey[slugPageKey] : undefined;
}

function pathsForPage(input: RevalidateInput, document: RevalidateDocument | undefined) {
  const pageKey = input.pageKey ?? pageKeyFrom(document);
  const slug = input.slug ?? textFrom(document, 'slug');
  const pagePath = pagePathFrom(pageKey, slug);

  return pagePath === undefined ? [] : [pagePath];
}

function pathsForProduct(input: RevalidateInput, document: RevalidateDocument | undefined) {
  const slug = input.slug ?? textFrom(document, 'slug') ?? textFrom(document, 'productId');
  const suffixes = ['/products'];

  if (isSafeSlug(slug)) {
    suffixes.push(`/products/${slug}`);
  }

  return suffixes;
}

function pathsForCategory(input: RevalidateInput, document: RevalidateDocument | undefined) {
  const slug =
    input.slug ??
    input.categoryId ??
    textFrom(document, 'slug') ??
    textFrom(document, 'categoryId');
  const suffixes = ['/products'];

  if (isSafeSlug(slug)) {
    suffixes.push(`/categories/${slug}`);
  }

  return suffixes;
}

function pathsForProductGroup() {
  return ['/products'];
}

function pathsForSolution(input: RevalidateInput, document: RevalidateDocument | undefined) {
  const slug = input.slug ?? textFrom(document, 'slug') ?? textFrom(document, 'solutionId');
  const suffixes = ['/solutions'];

  if (isSafeSlug(slug)) {
    suffixes.push(`/solutions/${slug}`);
  }

  return suffixes;
}

function pathsForNews(input: RevalidateInput, document: RevalidateDocument | undefined) {
  const slug = input.slug ?? textFrom(document, 'slug');
  const suffixes = ['/news'];

  if (isSafeSlug(slug)) {
    suffixes.push(`/news/${slug}`);
  }

  return suffixes;
}

function relationFromInputOrDocument(
  input: RevalidateInput,
  document: RevalidateDocument | undefined,
  key: 'newsRef' | 'pageRef' | 'productRef',
) {
  const inputRelation = relationInfoFrom(input[key]);
  const documentRelation = relationInfoFrom(document?.[key]);

  return {
    ...documentRelation,
    ...inputRelation,
  };
}

function pathsForFaq(input: RevalidateInput, document: RevalidateDocument | undefined) {
  const scope = input.scope ?? textFrom(document, 'scope');
  const suffixes = new Set<string>();

  if (scope === 'product') {
    const productRef = relationFromInputOrDocument(input, document, 'productRef');
    suffixes.add('/products');

    if (isSafeSlug(productRef.slug)) {
      suffixes.add(`/products/${productRef.slug}`);
    }
  } else if (scope === 'news') {
    const newsRef = relationFromInputOrDocument(input, document, 'newsRef');
    suffixes.add('/news');

    if (isSafeSlug(newsRef.slug)) {
      suffixes.add(`/news/${newsRef.slug}`);
    }
  } else if (scope === 'page') {
    const pageRef = relationFromInputOrDocument(input, document, 'pageRef');
    const pagePath = pagePathFrom(pageRef.pageKey, pageRef.slug);

    if (pagePath !== undefined) {
      suffixes.add(pagePath);
    }
  }

  if (suffixes.size === 0) {
    fixedPublicPathSuffixes.forEach((path) => suffixes.add(path));
  }

  return Array.from(suffixes);
}

function collectionNeedsDocument(input: RevalidateInput) {
  switch (input.collection) {
    case 'pages':
      return !input.pageKey && !input.slug;
    case 'products':
    case 'news':
    case 'solutions':
      return !input.slug;
    case 'product-groups':
      return false;
    case 'product-categories':
      return !input.slug && !input.categoryId;
    case 'faqs':
      return !input.scope && !input.pageRef && !input.productRef && !input.newsRef;
    default:
      return false;
  }
}

async function resolveDocument(input: RevalidateInput, options: RevalidationTargetOptions) {
  if (!input.collection || !input.documentId || !collectionNeedsDocument(input)) {
    return undefined;
  }

  return options.findDocument?.(input.collection, input.documentId);
}

export async function buildRevalidationTargets(
  input: RevalidateInput,
  options: RevalidationTargetOptions = {},
): Promise<RevalidationTargets> {
  const pathSet = new Set<string>(input.paths ?? []);
  const tagSet = new Set<string>();
  const skipped: RevalidationSkip[] = [];
  const document = await resolveDocument(input, options);

  addTags(tagSet, input.tags);

  if (input.collection) {
    tagSet.add(cmsCollectionCacheTag(input.collection));
  }

  if (input.global) {
    tagSet.add(cmsGlobalCacheTag(input.global));
  }

  if (input.collection && input.documentId && collectionNeedsDocument(input) && !document) {
    skipped.push({ reason: 'document-not-found', target: input.collection });
  }

  switch (input.collection) {
    case 'pages':
      addPaths(pathSet, pathsForPage(input, document ?? undefined));
      break;
    case 'products':
      addPaths(pathSet, pathsForProduct(input, document ?? undefined));
      break;
    case 'product-groups':
      addPaths(pathSet, pathsForProductGroup());
      break;
    case 'product-categories':
      addPaths(pathSet, pathsForCategory(input, document ?? undefined));
      break;
    case 'solutions':
      addPaths(pathSet, pathsForSolution(input, document ?? undefined));
      break;
    case 'news':
      addPaths(pathSet, pathsForNews(input, document ?? undefined));
      break;
    case 'faqs':
      addPaths(pathSet, pathsForFaq(input, document ?? undefined));
      break;
    default:
      break;
  }

  if (input.global) {
    addPaths(pathSet, fixedPublicPathSuffixes);
  }

  if (pathSet.size === 0 && tagSet.size === 0) {
    skipped.push({
      reason: 'no-safe-targets',
      target: input.collection ?? input.global ?? 'request',
    });
  }

  return {
    paths: Array.from(pathSet).sort(),
    skipped,
    tags: Array.from(tagSet).sort(),
  };
}

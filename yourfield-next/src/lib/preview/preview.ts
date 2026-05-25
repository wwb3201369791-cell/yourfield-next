import { timingSafeEqual } from 'node:crypto';

import { z } from 'zod';

import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/locale';

const previewCollections = ['pages', 'products', 'news'] as const;
const previewPageKeys = [
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

const previewCollectionSchema = z.enum(previewCollections);
const previewPageKeySchema = z.enum(previewPageKeys);
const previewSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const pagePathByKey: Record<PreviewPageKey, string> = {
  about: 'about',
  contact: 'contact',
  cookies: 'cookies',
  franchise: 'franchise',
  home: '',
  'news-index': 'news',
  privacy: 'privacy',
  'products-index': 'products',
  solutions: 'solutions',
  terms: 'terms',
};

export type PreviewCollection = (typeof previewCollections)[number];
export type PreviewPageKey = (typeof previewPageKeys)[number];

export type PreviewTarget =
  | Readonly<{
      collection: 'pages';
      locale: Locale;
      pageKey: PreviewPageKey;
      slug?: never;
    }>
  | Readonly<{
      collection: 'pages';
      locale: Locale;
      pageKey?: never;
      slug: string;
    }>
  | Readonly<{
      collection: 'products' | 'news';
      locale: Locale;
      slug: string;
    }>;

export type PreviewRequest = Readonly<{
  target: PreviewTarget;
  token: string;
}>;

export type PreviewValidationErrorCode =
  | 'INVALID_COLLECTION'
  | 'INVALID_LOCALE'
  | 'INVALID_PAGE_KEY'
  | 'INVALID_SLUG'
  | 'MISSING_COLLECTION'
  | 'MISSING_TARGET'
  | 'MISSING_TOKEN';

export type PreviewParseResult =
  | Readonly<{ ok: true; request: PreviewRequest }>
  | Readonly<{
      ok: false;
      code: PreviewValidationErrorCode;
      message: string;
    }>;

const fallbackRedirectPath = `/${defaultLocale}`;

function queryParam(searchParams: URLSearchParams, name: string) {
  const value = searchParams.get(name)?.trim();

  return value || undefined;
}

function invalid(code: PreviewValidationErrorCode, message: string): PreviewParseResult {
  return { code, message, ok: false };
}

function firstHeaderValue(value: string | null) {
  const first = value?.split(',')[0]?.trim();

  return first || undefined;
}

function normalizedHost(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) {
    return undefined;
  }

  try {
    return new URL(
      candidate.includes('://') ? candidate : `https://${candidate}`,
    ).host.toLowerCase();
  } catch {
    return undefined;
  }
}

function isLocalHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function isAllowedPreviewHost(candidate: URL, fallback: URL, allowedOrigins: readonly string[]) {
  const allowedHosts = new Set(
    [fallback.origin, ...allowedOrigins]
      .map((origin) => normalizedHost(origin))
      .filter((host): host is string => Boolean(host)),
  );

  if (allowedHosts.has(candidate.host.toLowerCase())) {
    return true;
  }

  return isLocalHostname(fallback.hostname) && isLocalHostname(candidate.hostname);
}

function parseLocale(value: string | undefined): Locale | PreviewParseResult {
  if (!value) {
    return defaultLocale;
  }

  return isLocale(value) ? value : invalid('INVALID_LOCALE', 'Unsupported preview locale.');
}

function parseSlug(value: string | undefined): string | PreviewParseResult {
  const result = previewSlugSchema.safeParse(value);

  return result.success ? result.data : invalid('INVALID_SLUG', 'Preview slug is invalid.');
}

function parsePageKey(value: string | undefined): PreviewPageKey | PreviewParseResult {
  const result = previewPageKeySchema.safeParse(value);

  return result.success ? result.data : invalid('INVALID_PAGE_KEY', 'Preview page key is invalid.');
}

export function isValidPreviewToken(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) {
    return false;
  }

  const tokenBytes = Buffer.from(token);
  const secretBytes = Buffer.from(secret);

  return tokenBytes.length === secretBytes.length && timingSafeEqual(tokenBytes, secretBytes);
}

export function parsePreviewRequest(searchParams: URLSearchParams): PreviewParseResult {
  const token = queryParam(searchParams, 'token');
  if (!token) {
    return invalid('MISSING_TOKEN', 'Preview token is required.');
  }

  const rawCollection = queryParam(searchParams, 'collection');
  if (!rawCollection) {
    return invalid('MISSING_COLLECTION', 'Preview collection is required.');
  }

  const collectionResult = previewCollectionSchema.safeParse(rawCollection);
  if (!collectionResult.success) {
    return invalid('INVALID_COLLECTION', 'Preview collection is not supported.');
  }

  const localeResult = parseLocale(queryParam(searchParams, 'locale'));
  if (typeof localeResult !== 'string') {
    return localeResult;
  }

  const collection = collectionResult.data;
  const rawSlug = queryParam(searchParams, 'slug');
  const rawPageKey = queryParam(searchParams, 'pageKey');

  if (collection === 'pages') {
    if (rawPageKey) {
      const pageKeyResult = parsePageKey(rawPageKey);

      return typeof pageKeyResult === 'string'
        ? {
            ok: true,
            request: {
              target: { collection, locale: localeResult, pageKey: pageKeyResult },
              token,
            },
          }
        : pageKeyResult;
    }

    if (rawSlug) {
      const slugResult = parseSlug(rawSlug);

      return typeof slugResult === 'string'
        ? {
            ok: true,
            request: { target: { collection, locale: localeResult, slug: slugResult }, token },
          }
        : slugResult;
    }

    return invalid('MISSING_TARGET', 'Pages preview requires pageKey or slug.');
  }

  if (!rawSlug) {
    return invalid('MISSING_TARGET', `${collection} preview requires slug.`);
  }

  const slugResult = parseSlug(rawSlug);

  return typeof slugResult === 'string'
    ? {
        ok: true,
        request: { target: { collection, locale: localeResult, slug: slugResult }, token },
      }
    : slugResult;
}

function localizedPath(locale: Locale, path: string) {
  return path ? `/${locale}/${path}` : `/${locale}`;
}

export function previewPathForTarget(target: PreviewTarget) {
  if (target.collection === 'pages') {
    return localizedPath(
      target.locale,
      target.pageKey ? pagePathByKey[target.pageKey] : target.slug,
    );
  }

  return localizedPath(target.locale, `${target.collection}/${target.slug}`);
}

export function previewRequestOrigin(
  headers: Headers,
  fallbackOrigin: string,
  allowedOrigins: readonly string[] = [],
) {
  const fallbackUrl = new URL(fallbackOrigin);
  const protocol =
    firstHeaderValue(headers.get('x-forwarded-proto')) ?? fallbackUrl.protocol.replace(/:$/, '');
  const safeProtocol = protocol === 'http' || protocol === 'https' ? protocol : 'https';
  const host =
    firstHeaderValue(headers.get('x-forwarded-host')) ?? firstHeaderValue(headers.get('host'));

  if (!host) {
    return fallbackUrl.origin;
  }

  try {
    const candidate = new URL(`${safeProtocol}://${host}`);

    return isAllowedPreviewHost(candidate, fallbackUrl, allowedOrigins)
      ? candidate.origin
      : fallbackUrl.origin;
  } catch {
    return fallbackUrl.origin;
  }
}

export function safeInternalRedirectPath(
  value: string | null | undefined,
  fallback = fallbackRedirectPath,
) {
  const candidate = value?.trim();

  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return fallback;
  }

  if (candidate.includes('\\') || candidate.toLowerCase().includes('%5c')) {
    return fallback;
  }

  try {
    const url = new URL(candidate, 'https://yourfield.local');
    const firstSegment = url.pathname.split('/').filter(Boolean)[0];

    if (!isLocale(firstSegment)) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

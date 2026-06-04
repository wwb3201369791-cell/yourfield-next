import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';
import { locales, type Locale } from '@/lib/i18n/locale';
import { absoluteUrl, hreflangByLocale, localizedPath } from '@/lib/seo/buildMetadata';

type SitemapChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

export type PublicSitemapRoute = Readonly<{
  changeFrequency: SitemapChangeFrequency;
  path: string;
  priority: number;
}>;

export type SitemapContentItem = Readonly<{
  lastModified?: Date | string;
  slug: string;
}>;

type NodeEnv = typeof env.NODE_ENV;
type IndexingEnvironment = Readonly<{
  allowIndexing?: string;
  nodeEnv?: NodeEnv;
  siteUrl?: string;
  vercelEnv?: string;
}>;

export const publicSitemapRoutes = [
  { changeFrequency: 'daily', path: '/', priority: 1 },
  { changeFrequency: 'weekly', path: '/about', priority: 0.8 },
  { changeFrequency: 'weekly', path: '/products', priority: 0.9 },
  { changeFrequency: 'weekly', path: '/solutions', priority: 0.8 },
  { changeFrequency: 'weekly', path: '/news', priority: 0.8 },
  { changeFrequency: 'weekly', path: '/franchise', priority: 0.7 },
  { changeFrequency: 'weekly', path: '/contact', priority: 0.7 },
] as const satisfies readonly PublicSitemapRoute[];

export const noIndexPublicRoutes = ['/search'] as const;

export const robotsDisallowPaths = [
  '/admin',
  '/admin/',
  '/api/',
  '/payload-api/',
  '/payload-graphql',
  '/payload-graphql-playground',
  '/*?preview=',
  '/*?draft=',
  '/*/search',
  '/*/search?*',
] as const;

export function siteHost() {
  return new URL(env.NEXT_PUBLIC_SITE_URL).host;
}

export function sitemapLanguages(path: string) {
  return {
    [hreflangByLocale.zh]: absoluteUrl(localizedPath('zh', path)),
    [hreflangByLocale.en]: absoluteUrl(localizedPath('en', path)),
    [hreflangByLocale.ru]: absoluteUrl(localizedPath('ru', path)),
    'ru-RU': absoluteUrl(localizedPath('ru', path)),
    'x-default': absoluteUrl(localizedPath('zh', path)),
  };
}

export function createSitemapEntry({
  changeFrequency,
  lastModified,
  locale,
  path,
  priority,
}: PublicSitemapRoute & {
  lastModified?: Date | string;
  locale: Locale;
}): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(localizedPath(locale, path)),
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
    alternates: {
      languages: sitemapLanguages(path),
    },
  };
}

export function localizedSitemapEntries(
  routes: readonly PublicSitemapRoute[] = publicSitemapRoutes,
) {
  return routes.flatMap((route) =>
    locales.map((locale) => createSitemapEntry({ ...route, locale })),
  );
}

export function contentSitemapEntries({
  basePath,
  changeFrequency,
  items,
  priority,
}: Readonly<{
  basePath: string;
  changeFrequency: SitemapChangeFrequency;
  items: readonly SitemapContentItem[];
  priority: number;
}>) {
  return items.flatMap((item) =>
    locales.map((locale) => {
      const { lastModified } = item;

      return createSitemapEntry({
        changeFrequency,
        ...(lastModified ? { lastModified } : {}),
        locale,
        path: `${basePath}/${item.slug}`,
        priority,
      });
    }),
  );
}

export function isSafeSitemapSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 160 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}

function readBooleanFlag(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return undefined;
}

function readRuntimeEnvironmentValue(name: string) {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };

  return runtime.process?.env?.[name];
}

function isPreviewLikeHost(siteUrl: string) {
  try {
    const hostname = new URL(siteUrl).hostname.toLowerCase();

    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.vercel.app') ||
      /(^|[.-])(dev|preview|preprod|pre-release|stage|staging|test|uat)([.-]|$)/u.test(hostname)
    );
  } catch {
    return true;
  }
}

export function isIndexingAllowed(environment: NodeEnv | IndexingEnvironment = {}) {
  const input = typeof environment === 'string' ? { nodeEnv: environment } : environment;
  const explicitIndexing = readBooleanFlag(
    input.allowIndexing ??
      readRuntimeEnvironmentValue('NEXT_PUBLIC_ALLOW_INDEXING') ??
      readRuntimeEnvironmentValue('ALLOW_INDEXING'),
  );

  if (explicitIndexing === false) {
    return false;
  }

  const nodeEnv = input.nodeEnv ?? env.NODE_ENV;
  if (nodeEnv !== 'production') {
    return false;
  }

  const vercelEnv = (input.vercelEnv ?? readRuntimeEnvironmentValue('VERCEL_ENV'))
    ?.trim()
    .toLowerCase();
  if (vercelEnv && vercelEnv !== 'production') {
    return false;
  }

  if (isPreviewLikeHost(input.siteUrl ?? env.NEXT_PUBLIC_SITE_URL)) {
    return false;
  }

  return explicitIndexing ?? true;
}

export function createRobotsRules(
  indexingAllowed = isIndexingAllowed(),
): MetadataRoute.Robots['rules'] {
  if (!indexingAllowed) {
    return [{ userAgent: '*', disallow: '/' }];
  }

  return [
    {
      userAgent: '*',
      allow: '/',
      disallow: [...robotsDisallowPaths],
    },
    {
      userAgent: 'Googlebot',
      allow: '/',
      disallow: [...robotsDisallowPaths],
    },
    {
      userAgent: 'Baiduspider',
      allow: '/',
      disallow: [...robotsDisallowPaths],
    },
    {
      userAgent: 'Yandex',
      allow: '/',
      disallow: [...robotsDisallowPaths],
    },
  ];
}

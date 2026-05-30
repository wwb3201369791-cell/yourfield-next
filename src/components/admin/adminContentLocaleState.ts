const contentLocaleParam = 'locale';
const fallbackLocaleParam = 'fallback-locale';
const contentLocaleIntentKey = 'yourfield.adminContentLocaleIntent';
const contentLocaleIntentMaxAgeMs = 30 * 60 * 1000;

export const defaultAdminContentLocale = 'zh';
export const adminContentLocales = ['zh', 'en', 'ru'] as const;

export type AdminContentLocale = (typeof adminContentLocales)[number];

type StorageLike = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

type ContentLocaleIntent = Readonly<{
  createdAt: number;
  locale: AdminContentLocale;
  pathname: string;
}>;

type BrowserLocationParts = Readonly<{
  hash: string;
  pathname: string;
  search: string;
}>;

type NormalizeOptions = Readonly<{
  adminPath?: string;
  now?: number;
  storage?: StorageLike;
}>;

function normalizeAdminPath(adminPath = '/admin') {
  const path = adminPath.startsWith('/') ? adminPath : `/${adminPath}`;
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

function relativeAdminPath(pathname: string, adminPath = '/admin') {
  const normalizedAdminPath = normalizeAdminPath(adminPath);

  if (pathname === normalizedAdminPath) {
    return '';
  }

  if (!pathname.startsWith(`${normalizedAdminPath}/`)) {
    return null;
  }

  return pathname.slice(normalizedAdminPath.length);
}

export function asAdminContentLocale(value: unknown): AdminContentLocale | null {
  return typeof value === 'string' && adminContentLocales.includes(value as AdminContentLocale)
    ? (value as AdminContentLocale)
    : null;
}

export function isPayloadAdminEditPath(pathname: string, adminPath = '/admin') {
  const relativePath = relativeAdminPath(pathname, adminPath);

  if (!relativePath) {
    return false;
  }

  return (
    /^\/globals\/[^/]+$/.test(relativePath) || /^\/collections\/[^/]+\/[^/]+$/.test(relativePath)
  );
}

function browserSessionStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readContentLocaleIntent(storage: StorageLike | null): ContentLocaleIntent | null {
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(contentLocaleIntentKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ContentLocaleIntent>;
    const locale = asAdminContentLocale(parsed.locale);

    if (!locale || typeof parsed.pathname !== 'string' || typeof parsed.createdAt !== 'number') {
      return null;
    }

    return {
      createdAt: parsed.createdAt,
      locale,
      pathname: parsed.pathname,
    };
  } catch {
    return null;
  }
}

function clearContentLocaleIntent(storage: StorageLike | null) {
  storage?.removeItem(contentLocaleIntentKey);
}

function isFreshIntent(intent: ContentLocaleIntent, now: number) {
  return now - intent.createdAt <= contentLocaleIntentMaxAgeMs;
}

export function markAdminContentLocaleIntent(
  pathname: string,
  locale: AdminContentLocale,
  options: Pick<NormalizeOptions, 'now' | 'storage'> = {},
) {
  const storage = options.storage ?? browserSessionStorage();

  if (!storage) {
    return;
  }

  storage.setItem(
    contentLocaleIntentKey,
    JSON.stringify({
      createdAt: options.now ?? Date.now(),
      locale,
      pathname,
    } satisfies ContentLocaleIntent),
  );
}

export function markCurrentAdminContentLocaleIntent(locale: AdminContentLocale) {
  if (typeof window === 'undefined') {
    return;
  }

  markAdminContentLocaleIntent(window.location.pathname, locale);
}

export function defaultAdminContentLocaleUrl(
  location: BrowserLocationParts,
  options: NormalizeOptions = {},
) {
  const storage = options.storage ?? browserSessionStorage();
  const now = options.now ?? Date.now();
  const intent = readContentLocaleIntent(storage);

  if (intent && (intent.pathname !== location.pathname || !isFreshIntent(intent, now))) {
    clearContentLocaleIntent(storage);
  }

  if (!isPayloadAdminEditPath(location.pathname, options.adminPath)) {
    return null;
  }

  const params = new URLSearchParams(location.search);
  const locale = asAdminContentLocale(params.get(contentLocaleParam));

  if (!locale || locale === defaultAdminContentLocale) {
    if (intent?.pathname === location.pathname) {
      clearContentLocaleIntent(storage);
    }

    return null;
  }

  const canUseIntent =
    intent?.pathname === location.pathname &&
    intent.locale === locale &&
    isFreshIntent(intent, now);

  if (canUseIntent) {
    return null;
  }

  params.set(contentLocaleParam, defaultAdminContentLocale);
  params.set(fallbackLocaleParam, 'null');

  const nextSearch = params.toString();
  return `${location.pathname}${nextSearch ? `?${nextSearch}` : ''}${location.hash}`;
}

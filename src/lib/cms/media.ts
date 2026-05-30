import { env } from '../env';

const localMediaPrefix = '/media/';

const localDevHostnames = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

function buildAllowedMediaHostnames(): Set<string> {
  const hostnames = new Set<string>(localDevHostnames);

  for (const source of [env.NEXT_PUBLIC_SITE_URL, env.PAYLOAD_PUBLIC_SERVER_URL]) {
    try {
      hostnames.add(new URL(source).hostname.toLowerCase());
    } catch {
      // ignore malformed env values; zod validation should have caught them
    }
  }

  return hostnames;
}

const allowedMediaHostnames = buildAllowedMediaHostnames();

function isAllowedMediaHostname(hostname: string) {
  return allowedMediaHostnames.has(hostname.toLowerCase());
}

const officialBrandLogoFallbacks = {
  a: '/images/brand/yourfield-logo-official-a.png',
  b: '/images/brand/yourfield-logo-official-b.png',
} as const;

const officialBrandLogoMediaPattern =
  /^\/media\/yourfield-logo-official-([ab])(?:-\d+)?(?:-\d+x\d+)?\.(?:png|webp)$/i;

function officialBrandLogoFallback(url: string, fallback: string) {
  const expectedVariant = Object.entries(officialBrandLogoFallbacks).find(
    ([, fallbackUrl]) => fallbackUrl === fallback,
  )?.[0] as keyof typeof officialBrandLogoFallbacks | undefined;

  if (!expectedVariant) {
    return null;
  }

  const match = officialBrandLogoMediaPattern.exec(url);
  const mediaVariant = match?.[1]?.toLowerCase() as
    | keyof typeof officialBrandLogoFallbacks
    | undefined;

  return mediaVariant === expectedVariant ? officialBrandLogoFallbacks[expectedVariant] : null;
}

function normalizeLocalMediaUrl(url: string, fallback: string) {
  return officialBrandLogoFallback(url, fallback) ?? url;
}

export function normalizeCmsMediaUrl(url: string | undefined, fallback: string) {
  if (!url) {
    return fallback;
  }

  if (url.startsWith(localMediaPrefix)) {
    return normalizeLocalMediaUrl(url, fallback);
  }

  try {
    const parsed = new URL(url);

    if (!isAllowedMediaHostname(parsed.hostname)) {
      return url;
    }

    const mediaPathIndex = parsed.pathname.indexOf(localMediaPrefix);

    if (mediaPathIndex >= 0) {
      return normalizeLocalMediaUrl(parsed.pathname.slice(mediaPathIndex), fallback);
    }

    return url;
  } catch {
    const mediaPathIndex = url.indexOf(localMediaPrefix);

    return mediaPathIndex >= 0 ? normalizeLocalMediaUrl(url.slice(mediaPathIndex), fallback) : url;
  }
}

type CmsMediaLike = Readonly<{
  sizes?: Record<string, { url?: string } | undefined> | undefined;
  url?: string | undefined;
}>;

export function selectCmsMediaUrl(media: CmsMediaLike | undefined) {
  return media?.url ?? media?.sizes?.card?.url;
}

export function shouldUseUnoptimizedImage(src: string) {
  return src.startsWith(localMediaPrefix) || /^https?:\/\//i.test(src);
}

import { env } from '@/lib/env';

const absoluteUrlPattern = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;
const schemePattern = /^[a-z][a-z\d+.-]*:/i;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function resolvePublicAssetUrl(path: string) {
  if (!path || absoluteUrlPattern.test(path) || schemePattern.test(path)) {
    return path;
  }

  const publicBase = env.S3_PUBLIC_URL_BASE?.trim();

  if (!publicBase) {
    return path;
  }

  return `${trimTrailingSlash(publicBase)}/${path.replace(/^\/+/, '')}`;
}

export const resolvePublicVideoUrl = resolvePublicAssetUrl;

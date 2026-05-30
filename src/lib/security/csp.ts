export const CONTENT_SECURITY_POLICY_HEADER = 'Content-Security-Policy';
export const CSP_NONCE_HEADER = 'x-nonce';

type ContentSecurityPolicyOptions = Readonly<{
  allowEval: boolean;
  nonce: string;
  publicMediaOrigin?: string | null;
}>;

const noncePattern = /^[A-Za-z0-9+/_=-]+$/;

function uniqueSources(sources: ReadonlyArray<string | null | undefined>) {
  return [...new Set(sources.filter((source): source is string => Boolean(source)))];
}

export function getCspOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy({
  allowEval,
  nonce,
  publicMediaOrigin,
}: ContentSecurityPolicyOptions) {
  if (!noncePattern.test(nonce)) {
    throw new Error('CSP nonce contains invalid characters.');
  }

  const scriptSources = uniqueSources([
    "'self'",
    `'nonce-${nonce}'`,
    allowEval ? "'unsafe-eval'" : null,
    'https://challenges.cloudflare.com',
  ]);
  const imageSources = uniqueSources(["'self'", 'data:', 'blob:', 'https:', publicMediaOrigin]);
  const mediaSources = uniqueSources(["'self'", 'blob:', 'data:', publicMediaOrigin]);

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imageSources.join(' ')}`,
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com https://*.amap.com https://*.autonavi.com https://*.google.com https://*.googleapis.com",
    "frame-src 'self' https://challenges.cloudflare.com https://www.google.com https://maps.google.com https://www.openstreetmap.org https://*.amap.com https://*.autonavi.com",
    `media-src ${mediaSources.join(' ')}`,
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ].join('; ');
}

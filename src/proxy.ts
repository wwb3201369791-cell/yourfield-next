import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './lib/i18n/routing';
import {
  canonicalHostFromSiteUrl,
  canonicalRedirectUrlForRequest,
  shouldRedirectToCanonicalHost,
} from './lib/security/canonicalHost';
import {
  buildContentSecurityPolicy,
  CONTENT_SECURITY_POLICY_HEADER,
  CSP_NONCE_HEADER,
  getCspOrigin,
} from './lib/security/csp';

const intlMiddleware = createMiddleware(routing);

const LEGACY_DETAIL_REDIRECTS = {
  '/product-detail.html': '/zh/products',
  '/news-detail.html': '/zh/news',
} as const;

function createCanonicalHostRedirect(request: NextRequest) {
  // eslint-disable-next-line no-restricted-syntax -- Proxy runs before app env parsing and must use deploy-time canonical URL.
  const canonicalUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const canonicalHost = canonicalHostFromSiteUrl(canonicalUrl);
  const requestHost = request.headers.get('host') || request.nextUrl.host;

  if (
    !shouldRedirectToCanonicalHost({
      canonicalHost,
      // eslint-disable-next-line no-restricted-syntax -- Proxy runs at the framework boundary before typed env is loaded.
      nodeEnv: process.env.NODE_ENV,
      requestHost,
    })
  ) {
    return null;
  }

  const redirectUrl = canonicalRedirectUrlForRequest({
    canonicalSiteUrl: canonicalUrl as string,
    requestUrl: request.url,
  });

  return redirectUrl ? NextResponse.redirect(redirectUrl, 308) : null;
}

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isPayloadPath(pathname: string) {
  return (
    pathname === '/payload-graphql' ||
    pathname === '/payload-graphql-playground' ||
    pathname === '/payload-api' ||
    pathname.startsWith('/payload-api/')
  );
}

function normalizeLegacyId(id: string | null) {
  if (!id) {
    return null;
  }

  const trimmedId = id.trim().toLowerCase();

  return /^[a-z0-9-]+$/.test(trimmedId) ? trimmedId : null;
}

function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  let value = '';
  bytes.forEach((byte) => {
    value += String.fromCharCode(byte);
  });

  return btoa(value);
}

function createCspRequestHeaders(request: NextRequest) {
  const nonce = createNonce();
  // eslint-disable-next-line no-restricted-syntax -- CSP must reflect the runtime environment before app env parsing is available.
  const allowEval = process.env.NODE_ENV !== 'production';
  const policy = buildContentSecurityPolicy({
    allowEval,
    nonce,
    // eslint-disable-next-line no-restricted-syntax -- Proxy mirrors the deploy-time media origin used by security headers.
    publicMediaOrigin: getCspOrigin(process.env.S3_PUBLIC_URL_BASE),
  });
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(CSP_NONCE_HEADER, nonce);
  requestHeaders.set(CONTENT_SECURITY_POLICY_HEADER, policy);
  request.headers.set(CSP_NONCE_HEADER, nonce);
  request.headers.set(CONTENT_SECURITY_POLICY_HEADER, policy);

  return { policy, requestHeaders };
}

function applyContentSecurityPolicy(response: NextResponse, policy: string) {
  response.headers.set(CONTENT_SECURITY_POLICY_HEADER, policy);

  return response;
}

export default function proxy(request: NextRequest) {
  const { policy, requestHeaders } = createCspRequestHeaders(request);
  const canonicalHostRedirect = createCanonicalHostRedirect(request);

  if (canonicalHostRedirect) {
    return applyContentSecurityPolicy(canonicalHostRedirect, policy);
  }

  if (isAdminPath(request.nextUrl.pathname) || isPayloadPath(request.nextUrl.pathname)) {
    return applyContentSecurityPolicy(
      NextResponse.next({ request: { headers: requestHeaders } }),
      policy,
    );
  }

  const detailRedirectBase =
    LEGACY_DETAIL_REDIRECTS[request.nextUrl.pathname as keyof typeof LEGACY_DETAIL_REDIRECTS];

  if (detailRedirectBase) {
    const legacyId = normalizeLegacyId(request.nextUrl.searchParams.get('id'));

    if (legacyId) {
      return applyContentSecurityPolicy(
        NextResponse.redirect(new URL(`${detailRedirectBase}/${legacyId}`, request.url), 308),
        policy,
      );
    }

    return applyContentSecurityPolicy(
      NextResponse.next({ request: { headers: requestHeaders } }),
      policy,
    );
  }

  return applyContentSecurityPolicy(intlMiddleware(request), policy);
}

export const config = {
  matcher: [
    '/product-detail.html',
    '/news-detail.html',
    '/admin/:path*',
    '/payload-api/:path*',
    '/payload-graphql',
    '/payload-graphql-playground',
    '/((?!api|admin|payload-api|payload-graphql|payload-graphql-playground|_next|_vercel|.*\\..*).*)',
  ],
};

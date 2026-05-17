import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './lib/i18n/routing';

const intlMiddleware = createMiddleware(routing);

const LEGACY_DETAIL_REDIRECTS = {
  '/product-detail.html': '/zh/products',
  '/news-detail.html': '/zh/news',
} as const;

function normalizeLegacyId(id: string | null) {
  if (!id) {
    return null;
  }

  const trimmedId = id.trim().toLowerCase();

  return /^[a-z0-9-]+$/.test(trimmedId) ? trimmedId : null;
}

export default function middleware(request: NextRequest) {
  const detailRedirectBase =
    LEGACY_DETAIL_REDIRECTS[request.nextUrl.pathname as keyof typeof LEGACY_DETAIL_REDIRECTS];

  if (detailRedirectBase) {
    const legacyId = normalizeLegacyId(request.nextUrl.searchParams.get('id'));

    if (legacyId) {
      return NextResponse.redirect(new URL(`${detailRedirectBase}/${legacyId}`, request.url), 308);
    }

    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/product-detail.html',
    '/news-detail.html',
    '/((?!api|admin|_next|_vercel|.*\\..*).*)',
  ],
};

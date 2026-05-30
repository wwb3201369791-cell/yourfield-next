import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { env } from '@/lib/env';
import { previewRequestOrigin, safeInternalRedirectPath } from '@/lib/preview/preview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  (await draftMode()).disable();

  const redirectPath = safeInternalRedirectPath(
    request.nextUrl.searchParams.get('redirect') ?? request.nextUrl.searchParams.get('next'),
  );

  return NextResponse.redirect(
    new URL(
      redirectPath,
      previewRequestOrigin(request.headers, request.nextUrl.origin, [
        env.NEXT_PUBLIC_SITE_URL,
        env.PAYLOAD_PUBLIC_SERVER_URL,
      ]),
    ),
    307,
  );
}

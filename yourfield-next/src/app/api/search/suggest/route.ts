import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { parseSearchSuggestParams } from '@/lib/search/params';
import { getPayloadSearchSources } from '@/lib/search/payload';
import { checkSearchRateLimit, getSearchClientIp } from '@/lib/search/request';
import { suggestContent } from '@/lib/search/search';
import type { SearchFieldErrors } from '@/lib/search/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ApiErrorCode = 'RATE_LIMITED' | 'SUGGEST_FAILED' | 'VALIDATION_ERROR';

function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: { fields?: SearchFieldErrors },
) {
  return NextResponse.json(
    {
      ok: false,
      error: details ? { code, details, message } : { code, message },
    },
    { status },
  );
}

export async function GET(request: NextRequest) {
  const parsed = parseSearchSuggestParams(request.nextUrl.searchParams);

  if (!parsed.ok) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid search suggestion parameters.', {
      fields: parsed.error.fields,
    });
  }

  const rateLimit = checkSearchRateLimit(getSearchClientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many search requests. Please try again later.',
        },
      },
      {
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        status: 429,
      },
    );
  }

  try {
    const response = await suggestContent(parsed.value, getPayloadSearchSources);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[search] suggest request failed', {
      error: error instanceof Error ? error.message : 'Unknown search suggest error',
    });

    return apiError(500, 'SUGGEST_FAILED', 'Search suggestions are temporarily unavailable.');
  }
}

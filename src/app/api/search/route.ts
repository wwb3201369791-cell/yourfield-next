import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { directSearchHitFor } from '@/lib/search/direct';
import { parseSearchParams } from '@/lib/search/params';
import {
  getPayloadRecommendedProductHits,
  getPayloadSearchSources,
  writePayloadSearchLog,
} from '@/lib/search/payload';
import { checkSearchRateLimit, getSearchClientIp } from '@/lib/search/request';
import { searchContent } from '@/lib/search/search';
import type { SearchFieldErrors } from '@/lib/search/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ApiErrorCode = 'RATE_LIMITED' | 'SEARCH_FAILED' | 'VALIDATION_ERROR';

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
  const parsed = parseSearchParams(request.nextUrl.searchParams);
  const isDirectResolution = request.nextUrl.searchParams.get('direct') === '1';
  const shouldLogDirectResolution = request.nextUrl.searchParams.get('log') === '1';

  if (!parsed.ok) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid search parameters.', {
      fields: parsed.error.fields,
    });
  }

  const clientIp = getSearchClientIp(request);
  const rateLimit = checkSearchRateLimit(clientIp);
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
    const response = await searchContent(
      parsed.value,
      getPayloadSearchSources,
      getPayloadRecommendedProductHits,
    );
    const directHit = isDirectResolution ? directSearchHitFor(parsed.value.q, response.hits) : null;

    if (!isDirectResolution || directHit || shouldLogDirectResolution) {
      await writePayloadSearchLog({
        hits: response.totalHits,
        input: parsed.value,
        ip: clientIp,
      });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[search] request failed', {
      error: error instanceof Error ? error.message : 'Unknown search error',
    });

    return apiError(500, 'SEARCH_FAILED', 'Search is temporarily unavailable.');
  }
}

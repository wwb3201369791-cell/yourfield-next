import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { parseSearchClickBody } from '@/lib/search/params';
import { writePayloadSearchClickLog } from '@/lib/search/payload';
import { checkSearchRateLimit, getSearchClientIp } from '@/lib/search/request';
import type { SearchFieldErrors } from '@/lib/search/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ApiErrorCode = 'RATE_LIMITED' | 'SEARCH_CLICK_FAILED' | 'VALIDATION_ERROR';

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

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getSearchClientIp(request);
  const rateLimit = checkSearchRateLimit(`click:${clientIp}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many search click requests. Please try again later.',
        },
      },
      {
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        status: 429,
      },
    );
  }

  const parsed = parseSearchClickBody(await readJson(request));

  if (!parsed.ok) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid search click payload.', {
      fields: parsed.error.fields,
    });
  }

  try {
    await writePayloadSearchClickLog({
      input: parsed.value,
      ip: clientIp,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[search] click request failed', {
      error: error instanceof Error ? error.message : 'Unknown search click error',
    });

    return apiError(500, 'SEARCH_CLICK_FAILED', 'Search click tracking is temporarily unavailable.');
  }
}

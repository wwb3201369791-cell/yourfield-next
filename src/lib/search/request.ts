import { isIP } from 'node:net';

import type { NextRequest } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 30 * 1000;
const RATE_LIMIT_MAX = 60;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const clientIpHeaderNames = ['cf-connecting-ip', 'x-real-ip', 'x-forwarded-for'] as const;

function getHeaderValue(request: NextRequest, name: string) {
  return request.headers.get(name)?.trim() || undefined;
}

function normalizeClientIp(value: string | undefined) {
  let candidate = value?.split(',')[0]?.trim().replace(/^"|"$/g, '');

  if (candidate?.startsWith('[')) {
    candidate = candidate.slice(1, candidate.indexOf(']') > 0 ? candidate.indexOf(']') : undefined);
  } else {
    candidate = candidate?.replace(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/u, '$1');
  }

  return candidate && candidate.length <= 100 && isIP(candidate) ? candidate : undefined;
}

function clientIpFromForwardedHeader(value: string | undefined) {
  const firstForwardedValue = value?.split(',')[0];
  const match = firstForwardedValue?.match(/(?:^|;)\s*for="?\[?([^;,"\]]+)/i);

  return normalizeClientIp(match?.[1]);
}

export function getSearchClientIp(request: NextRequest) {
  const platformIp = normalizeClientIp((request as { ip?: string }).ip);
  if (platformIp) {
    return platformIp;
  }

  for (const headerName of clientIpHeaderNames) {
    const headerIp = normalizeClientIp(getHeaderValue(request, headerName));
    if (headerIp) {
      return headerIp;
    }
  }

  return clientIpFromForwardedHeader(getHeaderValue(request, 'forwarded')) ?? 'unknown';
}

export function checkSearchRateLimit(key: string) {
  const now = Date.now();

  for (const [bucketKey, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(bucketKey);
    }
  }

  const existing = rateLimitBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });

    return { allowed: true, retryAfterSeconds: RATE_LIMIT_WINDOW_MS / 1000 };
  }

  existing.count += 1;

  return {
    allowed: existing.count <= RATE_LIMIT_MAX,
    retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

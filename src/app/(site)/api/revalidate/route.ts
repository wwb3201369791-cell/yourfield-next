import { createHmac, timingSafeEqual } from 'node:crypto';

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { z } from 'zod';

import { getPayloadClient } from '@/lib/cms/payload';
import { env } from '@/lib/env';
import {
  buildRevalidationTargets,
  revalidateRequestSchema,
  type RevalidateCollectionSlug,
  type RevalidateDocument,
} from '@/lib/revalidate/targets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 16 * 1024;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const noncePattern = /^[A-Za-z0-9_-]{16,128}$/;
const usedNonces = new Map<string, number>();

type ApiErrorCode =
  | 'INVALID_CONTENT_TYPE'
  | 'INVALID_JSON'
  | 'METHOD_NOT_ALLOWED'
  | 'NO_REVALIDATION_TARGETS'
  | 'PAYLOAD_TOO_LARGE'
  | 'REVALIDATE_FAILED'
  | 'REVALIDATE_NOT_CONFIGURED'
  | 'SERVER_ERROR'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR';

type RevalidationFailure = Readonly<{
  reason: string;
  target: string;
  type: 'path' | 'tag';
}>;

function apiError(status: number, code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: details ? { code, message, details } : { code, message },
    },
    { status },
  );
}

function methodNotAllowed() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Use POST to revalidate content.',
      },
    },
    {
      headers: { Allow: 'POST' },
      status: 405,
    },
  );
}

function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'request';
    errors[field] ??= [];
    errors[field].push(issue.message);
  }

  return errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanupExpiredNonces(now: number) {
  for (const [nonce, expiresAt] of usedNonces) {
    if (expiresAt <= now) {
      usedNonces.delete(nonce);
    }
  }
}

function signRevalidatePayload(secret: string, timestamp: string, nonce: string, bodyText: string) {
  return createHmac('sha256', secret)
    .update(timestamp)
    .update('.')
    .update(nonce)
    .update('.')
    .update(bodyText)
    .digest('hex');
}

function timingSafeStringEqual(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  return (
    expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

function hasValidSignature(request: NextRequest, bodyText: string) {
  if (!env.REVALIDATE_SECRET) {
    return false;
  }

  const timestamp = request.headers.get('x-revalidate-timestamp')?.trim();
  const nonce = request.headers.get('x-revalidate-nonce')?.trim();
  const signature = request.headers.get('x-revalidate-signature')?.trim();

  if (!timestamp || !nonce || !signature || !noncePattern.test(nonce)) {
    return false;
  }

  const timestampMs = Number(timestamp);
  const now = Date.now();

  cleanupExpiredNonces(now);

  if (!Number.isFinite(timestampMs) || Math.abs(now - timestampMs) > MAX_CLOCK_SKEW_MS) {
    return false;
  }

  if (usedNonces.has(nonce)) {
    return false;
  }

  const expectedSignature = signRevalidatePayload(
    env.REVALIDATE_SECRET,
    timestamp,
    nonce,
    bodyText,
  );

  if (!timingSafeStringEqual(expectedSignature, signature)) {
    return false;
  }

  usedNonces.set(nonce, now + MAX_CLOCK_SKEW_MS);

  return true;
}

async function readJsonBody(request: NextRequest) {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType && !contentType.includes('application/json')) {
    return {
      ok: false as const,
      response: apiError(415, 'INVALID_CONTENT_TYPE', 'Submit revalidate requests as JSON.'),
    };
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return {
      ok: false as const,
      response: apiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.'),
    };
  }

  try {
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
      return {
        ok: false as const,
        response: apiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.'),
      };
    }

    if (!text.trim()) {
      return { body: {}, bodyText: text, ok: true as const };
    }

    return { body: JSON.parse(text) as unknown, bodyText: text, ok: true as const };
  } catch {
    return {
      ok: false as const,
      response: apiError(400, 'INVALID_JSON', 'Invalid JSON payload.'),
    };
  }
}

async function findPayloadDocument(
  collection: RevalidateCollectionSlug,
  documentId: string,
): Promise<RevalidateDocument | null> {
  const payload = await getPayloadClient();

  try {
    const document = (await payload.findByID({
      collection,
      depth: 2,
      draft: true,
      id: documentId,
      overrideAccess: true,
    })) as unknown;

    return isRecord(document) ? document : null;
  } catch (error) {
    console.warn('[revalidate] document lookup failed', {
      collection,
      documentId,
      error: error instanceof Error ? error.message : 'Unknown document lookup error',
    });

    return null;
  }
}

function revalidateTargets(paths: readonly string[], tags: readonly string[]) {
  const revalidatedPaths: string[] = [];
  const revalidatedTags: string[] = [];
  const failed: RevalidationFailure[] = [];

  for (const path of paths) {
    try {
      revalidatePath(path);
      revalidatedPaths.push(path);
    } catch (error) {
      console.warn('[revalidate] path revalidation failed', {
        error: error instanceof Error ? error.message : 'Unknown path revalidation error',
        path,
      });
      failed.push({ reason: 'revalidate-path-failed', target: path, type: 'path' });
    }
  }

  for (const tag of tags) {
    try {
      revalidateTag(tag, 'max');
      revalidatedTags.push(tag);
    } catch (error) {
      console.warn('[revalidate] tag revalidation failed', {
        error: error instanceof Error ? error.message : 'Unknown tag revalidation error',
        tag,
      });
      failed.push({ reason: 'revalidate-tag-failed', target: tag, type: 'tag' });
    }
  }

  return {
    failed,
    revalidated: {
      paths: revalidatedPaths,
      tags: revalidatedTags,
    },
  };
}

export function GET() {
  return methodNotAllowed();
}

export async function POST(request: NextRequest) {
  if (!env.REVALIDATE_SECRET) {
    return apiError(503, 'REVALIDATE_NOT_CONFIGURED', 'Revalidation is not configured.');
  }

  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  if (!hasValidSignature(request, parsedBody.bodyText)) {
    return apiError(401, 'UNAUTHORIZED', 'Invalid revalidate credentials.');
  }

  const inputResult = revalidateRequestSchema.safeParse(parsedBody.body);
  if (!inputResult.success) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid revalidate payload.', {
      fields: fieldErrors(inputResult.error),
    });
  }

  try {
    const targets = await buildRevalidationTargets(inputResult.data, {
      findDocument: findPayloadDocument,
    });

    if (targets.paths.length === 0 && targets.tags.length === 0) {
      return apiError(
        400,
        'NO_REVALIDATION_TARGETS',
        'No safe revalidation targets were resolved.',
        {
          skipped: targets.skipped,
        },
      );
    }

    const result = revalidateTargets(targets.paths, targets.tags);
    const ok = result.failed.length === 0;

    return NextResponse.json(
      {
        ok,
        revalidated: result.revalidated,
        skipped: targets.skipped,
        failed: result.failed,
      },
      { status: ok ? 200 : 500 },
    );
  } catch (error) {
    console.error('[revalidate] request failed', {
      error: error instanceof Error ? error.message : 'Unknown revalidate error',
    });

    return apiError(500, 'SERVER_ERROR', 'Revalidation failed.');
  }
}

import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getPayloadClient } from '@/lib/cms/payload';
import { env } from '@/lib/env';
import {
  isValidPreviewToken,
  parsePreviewRequest,
  previewPathForTarget,
  previewRequestOrigin,
  type PreviewTarget,
} from '@/lib/preview/preview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ApiErrorCode =
  | 'INVALID_TOKEN'
  | 'NOT_FOUND'
  | 'PREVIEW_NOT_CONFIGURED'
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR';

type PreviewDocument = {
  id?: unknown;
};

function errorResponse(status: number, code: ApiErrorCode, message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
    },
    { status },
  );
}

function hasDocumentId(document: PreviewDocument | undefined) {
  return typeof document?.id === 'string' || typeof document?.id === 'number';
}

async function findPreviewDocument(target: PreviewTarget) {
  const payload = await getPayloadClient();

  if (target.collection === 'pages') {
    const result = await payload.find({
      collection: 'pages',
      depth: 0,
      draft: true,
      fallbackLocale: 'none',
      limit: 1,
      locale: target.locale,
      overrideAccess: true,
      where: target.pageKey
        ? { pageKey: { equals: target.pageKey } }
        : { slug: { equals: target.slug } },
    });

    return result.docs[0] as PreviewDocument | undefined;
  }

  if (target.collection === 'products') {
    const result = await payload.find({
      collection: 'products',
      depth: 0,
      draft: true,
      fallbackLocale: 'none',
      limit: 1,
      locale: target.locale,
      overrideAccess: true,
      where: { slug: { equals: target.slug } },
    });

    return result.docs[0] as PreviewDocument | undefined;
  }

  const result = await payload.find({
    collection: 'news',
    depth: 0,
    draft: true,
    fallbackLocale: 'none',
    limit: 1,
    locale: target.locale,
    overrideAccess: true,
    where: { slug: { equals: target.slug } },
  });

  return result.docs[0] as PreviewDocument | undefined;
}

export async function GET(request: NextRequest) {
  const parsed = parsePreviewRequest(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return errorResponse(400, 'VALIDATION_ERROR', parsed.message);
  }

  if (!env.PAYLOAD_PREVIEW_SECRET) {
    console.warn('[preview] preview rejected because secret is not configured');

    return errorResponse(503, 'PREVIEW_NOT_CONFIGURED', 'Preview is not configured.');
  }

  if (!isValidPreviewToken(parsed.request.token, env.PAYLOAD_PREVIEW_SECRET)) {
    console.warn('[preview] invalid preview token rejected', {
      collection: parsed.request.target.collection,
      locale: parsed.request.target.locale,
    });

    return errorResponse(401, 'INVALID_TOKEN', 'Invalid preview token.');
  }

  try {
    const document = await findPreviewDocument(parsed.request.target);

    if (!hasDocumentId(document)) {
      return errorResponse(404, 'NOT_FOUND', 'Preview target was not found.');
    }

    draftMode().enable();

    const redirectUrl = new URL(
      previewPathForTarget(parsed.request.target),
      previewRequestOrigin(request.headers, request.nextUrl.origin, [
        env.NEXT_PUBLIC_SITE_URL,
        env.PAYLOAD_PUBLIC_SERVER_URL,
      ]),
    );
    redirectUrl.searchParams.set('preview', '1');

    return NextResponse.redirect(redirectUrl, 307);
  } catch (error) {
    console.error('[preview] preview lookup failed', {
      collection: parsed.request.target.collection,
      locale: parsed.request.target.locale,
      error: error instanceof Error ? error.message : 'Unknown preview error',
    });

    return errorResponse(500, 'SERVER_ERROR', 'Preview could not be opened.');
  }
}

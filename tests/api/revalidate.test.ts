import { createHmac, randomUUID } from 'node:crypto';

import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as RevalidateRoute from '@/app/(site)/api/revalidate/route';

type RouteModule = typeof RevalidateRoute;

const createPayloadStub = (document: Record<string, unknown> | null = null) => ({
  findByID: vi.fn(() => Promise.resolve(document)),
});

type PayloadStub = ReturnType<typeof createPayloadStub>;

type LoadRouteOptions = {
  payload?: PayloadStub;
  secret?: string;
};

const loadRoute = async ({
  payload = createPayloadStub(),
  secret = 'expected-revalidate-secret',
}: LoadRouteOptions = {}) => {
  const revalidatePathMock = vi.fn();
  const revalidateTagMock = vi.fn();

  vi.resetModules();
  vi.doMock('@/lib/env', () => ({
    env: {
      REVALIDATE_SECRET: secret,
    },
  }));
  vi.doMock('@/lib/cms/payload', () => ({
    getPayloadClient: vi.fn(() => Promise.resolve(payload)),
  }));
  vi.doMock('next/cache', () => ({
    revalidatePath: revalidatePathMock,
    revalidateTag: revalidateTagMock,
    unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  }));

  const route: RouteModule = await import('@/app/(site)/api/revalidate/route');

  return { payload, revalidatePathMock, revalidateTagMock, route };
};

type SignedRequestOptions = {
  body: Record<string, unknown>;
  contentType?: string;
  contentLengthOverride?: string;
  secret?: string;
  withSignature?: boolean;
  nonce?: string;
  timestamp?: string;
  signatureOverride?: string;
};

const signedRequest = ({
  body,
  contentType = 'application/json',
  contentLengthOverride,
  secret = 'expected-revalidate-secret',
  withSignature = true,
  nonce,
  timestamp,
  signatureOverride,
}: SignedRequestOptions) => {
  const headers = new Headers({ 'content-type': contentType });
  const bodyText = JSON.stringify(body);

  if (withSignature) {
    const usedTimestamp = timestamp ?? String(Date.now());
    const usedNonce = nonce ?? randomUUID();
    const signature =
      signatureOverride ??
      createHmac('sha256', secret)
        .update(usedTimestamp)
        .update('.')
        .update(usedNonce)
        .update('.')
        .update(bodyText)
        .digest('hex');

    headers.set('x-revalidate-nonce', usedNonce);
    headers.set('x-revalidate-signature', signature);
    headers.set('x-revalidate-timestamp', usedTimestamp);
  }

  if (contentLengthOverride) {
    headers.set('content-length', contentLengthOverride);
  }

  return new NextRequest('http://localhost:3000/api/revalidate', {
    body: bodyText,
    headers,
    method: 'POST',
  });
};

const responseJson = async (response: Response) =>
  (await response.json()) as Record<string, unknown>;

afterEach(() => {
  vi.doUnmock('@/lib/cms/payload');
  vi.doUnmock('@/lib/env');
  vi.doUnmock('next/cache');
  vi.resetModules();
});

describe('POST /api/revalidate (HTTP contract)', () => {
  it('200 happy path: signed product publish payload triggers revalidatePath and tag', async () => {
    const { revalidatePathMock, revalidateTagMock, route } = await loadRoute();

    const response = await route.POST(
      signedRequest({
        body: {
          collection: 'products',
          operation: 'publish',
          slug: 'firefighter-suit-combat',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({ ok: true });
    expect(revalidatePathMock).toHaveBeenCalled();
    expect(revalidateTagMock).toHaveBeenCalledWith('cms:collection:products', 'max');
  });

  it('401 when the signature headers are absent', async () => {
    const { revalidatePathMock, route } = await loadRoute();

    const response = await route.POST(
      signedRequest({
        body: { collection: 'products', slug: 'firefighter-suit-combat' },
        withSignature: false,
      }),
    );

    expect(response.status).toBe(401);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'UNAUTHORIZED' },
      ok: false,
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('401 when the signature is present but does not match the secret', async () => {
    const { revalidatePathMock, route } = await loadRoute();

    const response = await route.POST(
      signedRequest({
        body: { collection: 'products', slug: 'firefighter-suit-combat' },
        signatureOverride: 'deadbeef'.repeat(8),
      }),
    );

    expect(response.status).toBe(401);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'UNAUTHORIZED' },
      ok: false,
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('401 when a nonce is reused (replay protection)', async () => {
    const { route } = await loadRoute();
    const sharedNonce = randomUUID();

    const first = await route.POST(
      signedRequest({
        body: { collection: 'products', operation: 'publish', slug: 'firefighter-suit-combat' },
        nonce: sharedNonce,
      }),
    );
    expect(first.status).toBe(200);

    // Build a second request using the same nonce but a fresh signature for the same body.
    const replay = await route.POST(
      signedRequest({
        body: { collection: 'products', operation: 'publish', slug: 'firefighter-suit-combat' },
        nonce: sharedNonce,
      }),
    );

    expect(replay.status).toBe(401);
    expect(await responseJson(replay)).toMatchObject({
      error: { code: 'UNAUTHORIZED' },
      ok: false,
    });
  });

  it('413 PAYLOAD_TOO_LARGE when content-length advertises an oversized body', async () => {
    const { revalidatePathMock, route } = await loadRoute();

    const response = await route.POST(
      signedRequest({
        body: { collection: 'products', slug: 'firefighter-suit-combat' },
        contentLengthOverride: String(64 * 1024),
      }),
    );

    expect(response.status).toBe(413);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'PAYLOAD_TOO_LARGE' },
      ok: false,
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('405 METHOD_NOT_ALLOWED on GET with an Allow: POST header', async () => {
    const { route } = await loadRoute();

    const response = route.GET();

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'METHOD_NOT_ALLOWED' },
      ok: false,
    });
  });
});

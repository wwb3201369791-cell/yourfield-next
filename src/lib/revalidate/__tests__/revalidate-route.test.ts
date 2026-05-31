import { createHmac, randomUUID } from 'node:crypto';

import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

type PayloadFindByIdArgs = {
  collection: string;
  depth?: number;
  draft?: boolean;
  id: string;
  overrideAccess?: boolean;
};

const createPayloadStub = (document: Record<string, unknown> | null = null) => ({
  findByID: vi.fn((_args: PayloadFindByIdArgs) => Promise.resolve(document)),
});

type LoadRouteOptions = {
  payload?: ReturnType<typeof createPayloadStub>;
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
  }));

  const route = await import('@/app/(site)/api/revalidate/route');

  return { payload, revalidatePathMock, revalidateTagMock, route };
};

const revalidateRequest = (
  body: Record<string, unknown>,
  secret: string | undefined = 'expected-revalidate-secret',
) => {
  const headers = new Headers({ 'content-type': 'application/json' });
  const bodyText = JSON.stringify(body);

  if (secret) {
    const timestamp = String(Date.now());
    const nonce = randomUUID();
    const signature = createHmac('sha256', secret)
      .update(timestamp)
      .update('.')
      .update(nonce)
      .update('.')
      .update(bodyText)
      .digest('hex');

    headers.set('x-revalidate-nonce', nonce);
    headers.set('x-revalidate-signature', signature);
    headers.set('x-revalidate-timestamp', timestamp);
  }

  return new NextRequest('http://localhost:3000/api/revalidate', {
    body: bodyText,
    headers,
    method: 'POST',
  });
};

const responseJson = async <T>(response: Response) => (await response.json()) as T;

afterEach(() => {
  vi.doUnmock('@/lib/cms/payload');
  vi.doUnmock('@/lib/env');
  vi.doUnmock('next/cache');
  vi.resetModules();
});

describe('POST /api/revalidate', () => {
  it('returns 401 and does not revalidate when the secret is missing', async () => {
    const { revalidatePathMock, route } = await loadRoute();

    const response = await route.POST(
      revalidateRequest({ collection: 'products', slug: 'firefighter-suit-combat' }, ''),
    );

    expect(response.status).toBe(401);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'UNAUTHORIZED' },
      ok: false,
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('revalidates homepage, product list and detail paths for a product publish payload', async () => {
    const { revalidatePathMock, revalidateTagMock, route } = await loadRoute();

    const response = await route.POST(
      revalidateRequest({
        collection: 'products',
        operation: 'publish',
        slug: 'firefighter-suit-combat',
      }),
    );

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({ ok: true });
    expect(revalidatePathMock).toHaveBeenCalledWith('/zh');
    expect(revalidatePathMock).toHaveBeenCalledWith('/en');
    expect(revalidatePathMock).toHaveBeenCalledWith('/ru');
    expect(revalidatePathMock).toHaveBeenCalledWith('/zh/products');
    expect(revalidatePathMock).toHaveBeenCalledWith('/en/products');
    expect(revalidatePathMock).toHaveBeenCalledWith('/ru/products');
    expect(revalidatePathMock).toHaveBeenCalledWith('/zh/products/firefighter-suit-combat');
    expect(revalidatePathMock).toHaveBeenCalledWith('/en/products/firefighter-suit-combat');
    expect(revalidatePathMock).toHaveBeenCalledWith('/ru/products/firefighter-suit-combat');
    expect(revalidateTagMock).toHaveBeenCalledWith('cms:collection:products', 'max');
  });

  it('revalidates homepage and product list paths for product group changes', async () => {
    const { revalidatePathMock, revalidateTagMock, route } = await loadRoute();

    const response = await route.POST(
      revalidateRequest({
        collection: 'product-groups',
        operation: 'update',
      }),
    );

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({ ok: true });
    expect(revalidatePathMock).toHaveBeenCalledWith('/zh');
    expect(revalidatePathMock).toHaveBeenCalledWith('/en');
    expect(revalidatePathMock).toHaveBeenCalledWith('/ru');
    expect(revalidatePathMock).toHaveBeenCalledWith('/zh/products');
    expect(revalidatePathMock).toHaveBeenCalledWith('/en/products');
    expect(revalidatePathMock).toHaveBeenCalledWith('/ru/products');
    expect(revalidateTagMock).toHaveBeenCalledWith('cms:collection:product-groups', 'max');
  });

  it('maps pages.home to the three localized homepage paths', async () => {
    const { revalidatePathMock, revalidateTagMock, route } = await loadRoute();

    const response = await route.POST(
      revalidateRequest({
        collection: 'pages',
        operation: 'publish',
        pageKey: 'home',
      }),
    );

    expect(response.status).toBe(200);
    expect(revalidatePathMock).toHaveBeenCalledTimes(3);
    expect(revalidatePathMock).toHaveBeenCalledWith('/zh');
    expect(revalidatePathMock).toHaveBeenCalledWith('/en');
    expect(revalidatePathMock).toHaveBeenCalledWith('/ru');
    expect(revalidateTagMock).toHaveBeenCalledWith('cms:collection:pages', 'max');
  });

  it('maps navigation and site settings changes to public key paths', async () => {
    const { revalidatePathMock, revalidateTagMock, route } = await loadRoute();

    const response = await route.POST(
      revalidateRequest({
        global: 'navigation',
        operation: 'config-change',
      }),
    );

    expect(response.status).toBe(200);
    expect(revalidatePathMock).toHaveBeenCalledWith('/zh');
    expect(revalidatePathMock).toHaveBeenCalledWith('/en/news');
    expect(revalidatePathMock).toHaveBeenCalledWith('/ru/contact');
    expect(revalidateTagMock).toHaveBeenCalledWith('cms:global:navigation', 'max');
  });

  it('rejects unsafe explicit paths before calling Next revalidation APIs', async () => {
    const { revalidatePathMock, route } = await loadRoute();

    const response = await route.POST(
      revalidateRequest({
        paths: ['https://evil.example/zh/products'],
      }),
    );

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
      ok: false,
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('can resolve a slug from Payload when hook payload only has documentId', async () => {
    const payload = createPayloadStub({ slug: 'company-update' });
    const { revalidatePathMock, revalidateTagMock, route } = await loadRoute({ payload });

    const response = await route.POST(
      revalidateRequest({
        collection: 'news',
        documentId: 'news-1',
        operation: 'publish',
      }),
    );

    expect(response.status).toBe(200);
    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news',
        draft: true,
        id: 'news-1',
        overrideAccess: true,
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/zh');
    expect(revalidatePathMock).toHaveBeenCalledWith('/en');
    expect(revalidatePathMock).toHaveBeenCalledWith('/ru');
    expect(revalidatePathMock).toHaveBeenCalledWith('/zh/news');
    expect(revalidatePathMock).toHaveBeenCalledWith('/zh/news/company-update');
    expect(revalidatePathMock).toHaveBeenCalledWith('/en/news/company-update');
    expect(revalidatePathMock).toHaveBeenCalledWith('/ru/news/company-update');
    expect(revalidateTagMock).toHaveBeenCalledWith('cms:collection:news', 'max');
  });
});

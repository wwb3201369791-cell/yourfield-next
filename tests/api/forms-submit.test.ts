import { NextRequest } from 'next/server';
import type { Mock } from 'vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as FormsSubmitRoute from '@/app/(site)/api/forms/submit/route';

type RouteModule = typeof FormsSubmitRoute;
type FetchMock = Mock<typeof fetch>;

const contactFormSessionCookieName = 'yourfield.contactFormSession';
const contactFormSessionCookie = (value: string) => `${contactFormSessionCookieName}=${value}`;

type PayloadCreateArgs = {
  collection: string;
  data: Record<string, unknown>;
  overrideAccess?: boolean;
};

type PayloadFindArgs = {
  collection: string;
  depth?: number;
  limit?: number;
  overrideAccess?: boolean;
  where?: unknown;
};

type ProductDocument = {
  id: string | number;
};

const createPayloadStub = (productDocs: ProductDocument[] = []) => ({
  create: vi.fn((_args: PayloadCreateArgs) => Promise.resolve({ id: 'submission-1' })),
  find: vi.fn((_args: PayloadFindArgs) => Promise.resolve({ docs: productDocs })),
});

type PayloadStub = ReturnType<typeof createPayloadStub>;

type LoadRouteOptions = {
  payload?: PayloadStub;
  trustProxyHeaders?: boolean;
  turnstileSecret?: string;
};

const loadRoute = async ({
  payload = createPayloadStub(),
  trustProxyHeaders = false,
  turnstileSecret,
}: LoadRouteOptions = {}) => {
  vi.resetModules();
  vi.doMock('@/lib/env', () => ({
    env: {
      CONTACT_FORM_TRUST_PROXY_HEADERS: trustProxyHeaders,
      NEXT_PUBLIC_DEFAULT_LOCALE: 'zh',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: turnstileSecret ? 'turnstile-site-key' : undefined,
      TURNSTILE_SECRET: turnstileSecret,
    },
  }));
  vi.doMock('@/lib/cms/payload', () => ({
    getPayloadClient: vi.fn(() => Promise.resolve(payload)),
  }));

  const route: RouteModule = await import('@/app/(site)/api/forms/submit/route');

  return { payload, route };
};

const formRequest = (body: Record<string, unknown>, headers?: HeadersInit) => {
  const requestHeaders = new Headers(headers);
  requestHeaders.set('content-type', 'application/json');

  return new NextRequest('http://localhost:3000/api/forms/submit', {
    body: JSON.stringify(body),
    headers: requestHeaders,
    method: 'POST',
  });
};

const validSubmission = (overrides: Record<string, unknown> = {}) => ({
  consentAcceptedAt: '2026-05-16T00:00:00.000Z',
  email: 'LEAD@EXAMPLE.COM',
  message: 'Please contact me about protective gear.',
  mobile: '+44 20 7946 0958',
  name: 'Test Lead',
  ...overrides,
});

const responseJson = async (response: Response) => {
  const body: unknown = await response.json();

  return body;
};

const firstCreateCall = (payload: PayloadStub) => {
  const call = payload.create.mock.calls[0]?.[0];
  if (!call) {
    throw new Error('Expected Payload create to be called.');
  }

  return call;
};

afterEach(() => {
  vi.doUnmock('@/lib/cms/payload');
  vi.doUnmock('@/lib/env');
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('POST /api/forms/submit', () => {
  it('returns 422 and does not create a submission for invalid input', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.POST(
      formRequest({
        consentAcceptedAt: '2026-05-16T00:00:00.000Z',
        email: 'not-an-email',
        message: 'x',
        name: '',
      }),
    );

    expect(response.status).toBe(422);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
      ok: false,
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('requires an email address even when a phone number is provided', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.POST(
      formRequest(
        validSubmission({
          email: undefined,
        }),
      ),
    );

    expect(response.status).toBe(422);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
      ok: false,
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('requires a phone number even when an email address is provided', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.POST(
      formRequest(
        validSubmission({
          mobile: undefined,
        }),
      ),
    );

    expect(response.status).toBe(422);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
      ok: false,
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('rejects incomplete or malformed global phone numbers', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.POST(
      formRequest(
        validSubmission({
          mobile: '12345',
        }),
      ),
    );

    expect(response.status).toBe(422);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
      ok: false,
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('creates a valid submission through Payload Local API with access override', async () => {
    const payload = createPayloadStub([{ id: 'product-1' }]);
    const { route } = await loadRoute({ payload });

    const response = await route.POST(
      formRequest(
        validSubmission({
          product: 'firefighter-suit-combat',
          sourceUrl: 'http://localhost:3000/zh/contact?product=firefighter-suit-combat',
        }),
        { 'user-agent': 'vitest form test' },
      ),
    );

    expect(response.status).toBe(201);
    expect(await responseJson(response)).toMatchObject({ id: 'submission-1', ok: true });

    const findCall = payload.find.mock.calls[0]?.[0];
    expect(findCall).toMatchObject({
      collection: 'products',
      overrideAccess: true,
    });

    const createCall = firstCreateCall(payload);
    expect(createCall).toMatchObject({
      collection: 'form-submissions',
      overrideAccess: true,
    });
    expect(createCall.data).toMatchObject({
      email: 'lead@example.com',
      message: 'Please contact me about protective gear.',
      name: 'Test Lead',
      phone: '+44 20 7946 0958',
      productRef: 'product-1',
      sourceLocale: 'zh',
      sourceUrl: 'http://localhost:3000/zh/contact?product=firefighter-suit-combat',
      status: 'new',
      userAgent: 'vitest form test',
    });
  });

  it('sets an HttpOnly form session cookie for accepted submissions', async () => {
    const { route } = await loadRoute();

    const response = await route.POST(formRequest(validSubmission()));

    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toContain(`${contactFormSessionCookieName}=`);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=lax');
  });

  it('uses trusted proxy IPs for form metadata when proxy headers are explicitly trusted', async () => {
    const payload = createPayloadStub();
    const { route } = await loadRoute({ payload, trustProxyHeaders: true });

    const response = await route.POST(
      formRequest(validSubmission(), {
        'x-forwarded-for': '203.0.113.44, 10.0.0.1',
      }),
    );

    expect(response.status).toBe(201);
    expect(firstCreateCall(payload).data).toMatchObject({
      ip: '203.0.113.44',
    });
  });

  it('ignores honeypot submissions without creating a lead', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.POST(
      formRequest({
        website: 'https://spam.example',
      }),
    );

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({ ok: true });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('rejects oversized request bodies before creating a submission', async () => {
    const { payload, route } = await loadRoute();

    const response = await route.POST(
      formRequest(
        validSubmission({
          message: 'x'.repeat(25 * 1024),
        }),
      ),
    );

    expect(response.status).toBe(413);
    expect(await responseJson(response)).toMatchObject({
      error: { code: 'PAYLOAD_TOO_LARGE' },
      ok: false,
    });
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('adds a timeout signal when verifying Turnstile tokens', async () => {
    const fetchMock: FetchMock = vi.fn((_input, _init) =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true }), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { payload, route } = await loadRoute({ turnstileSecret: 'turnstile-secret' });

    const response = await route.POST(
      formRequest(
        validSubmission({
          turnstileToken: 'turnstile-token',
        }),
      ),
    );

    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
      }),
    );
    expect(payload.create).toHaveBeenCalledTimes(1);
  });

  it('normalizes quoted and padded Turnstile secrets before verification', async () => {
    let verifyBody: BodyInit | null | undefined;
    const fetchMock: FetchMock = vi.fn((_input, init) => {
      verifyBody = init?.body;

      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const { payload, route } = await loadRoute({
      turnstileSecret: ' "turnstile-secret" ',
    });

    const response = await route.POST(
      formRequest(
        validSubmission({
          turnstileToken: 'turnstile-token',
        }),
      ),
    );

    expect(response.status).toBe(201);
    expect(verifyBody).toBeInstanceOf(URLSearchParams);
    expect((verifyBody as URLSearchParams).get('secret')).toBe('turnstile-secret');
    expect(payload.create).toHaveBeenCalledTimes(1);
  });

  it('rate limits unknown-IP submissions by form session without sharing one global bucket', async () => {
    const { payload, route } = await loadRoute();
    const responses: Response[] = [];

    for (const attempt of [1, 2, 3, 4]) {
      responses.push(
        await route.POST(
          formRequest(validSubmission({ email: `lead-a-${attempt}@example.com` }), {
            cookie: contactFormSessionCookie('session-client-a-0001'),
            'user-agent': 'vitest contact client',
            'x-forwarded-for': `203.0.113.${attempt}`,
          }),
        ),
      );
    }

    const otherClientResponse = await route.POST(
      formRequest(validSubmission({ email: 'lead-b@example.com' }), {
        cookie: contactFormSessionCookie('session-client-b-0001'),
        'user-agent': 'vitest contact client',
        'x-forwarded-for': '203.0.113.99',
      }),
    );

    expect(responses.map((response) => response.status)).toEqual([201, 201, 201, 429]);
    const rateLimitedResponse = responses[3];
    if (!rateLimitedResponse) {
      throw new Error('Expected the fourth submission to be rate limited.');
    }

    expect(await responseJson(rateLimitedResponse)).toMatchObject({
      error: { code: 'RATE_LIMITED' },
      ok: false,
    });
    expect(rateLimitedResponse.headers.get('retry-after')).toBeTruthy();
    expect(otherClientResponse.status).toBe(201);
    expect(payload.create).toHaveBeenCalledTimes(4);
  });
});

describe('FormSubmissions Payload access', () => {
  it('blocks manual form-submission creation while preserving admin management', async () => {
    const { FormSubmissions } = await import('@/collections/FormSubmissions');
    const readAccess = FormSubmissions.access?.read;
    const createAccess = FormSubmissions.access?.create;
    const updateAccess = FormSubmissions.access?.update;
    const deleteAccess = FormSubmissions.access?.delete;

    if (
      typeof readAccess !== 'function' ||
      typeof createAccess !== 'function' ||
      typeof updateAccess !== 'function' ||
      typeof deleteAccess !== 'function'
    ) {
      throw new Error('Expected FormSubmissions management access to be configured.');
    }

    const anonymousCreateResult = await createAccess({ req: {} } as Parameters<
      typeof createAccess
    >[0]);
    const anonymousDeleteResult = await deleteAccess({ req: {} } as Parameters<
      typeof deleteAccess
    >[0]);
    const adminReq = {
      context: {},
      payload: {
        findByID: vi.fn(),
      },
      user: {
        email: 'admin@example.com',
        id: 'admin-1',
        role: {
          slug: 'super-admin',
        },
      },
    };
    const authenticatedReadResult = await readAccess({
      req: adminReq,
    } as unknown as Parameters<typeof readAccess>[0]);
    const authenticatedCreateResult = await createAccess({
      req: adminReq,
    } as unknown as Parameters<typeof createAccess>[0]);
    const authenticatedUpdateResult = await updateAccess({
      req: adminReq,
    } as unknown as Parameters<typeof updateAccess>[0]);
    const authenticatedDeleteResult = await deleteAccess({
      req: adminReq,
    } as unknown as Parameters<typeof deleteAccess>[0]);

    expect(anonymousCreateResult).toBe(false);
    expect(anonymousDeleteResult).toBe(false);
    expect(authenticatedReadResult).toBe(true);
    expect(authenticatedCreateResult).toBe(false);
    expect(authenticatedUpdateResult).toBe(true);
    expect(authenticatedDeleteResult).toBe(true);
  });
});

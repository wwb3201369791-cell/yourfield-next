import { createHash, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { getPayloadClient } from '@/lib/cms/payload';
import { env } from '@/lib/env';
import { isValidGlobalPhoneNumber } from '@/lib/forms/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 24 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 3;
const CONTACT_FORM_SESSION_COOKIE_NAME = 'yourfield.contactFormSession';
const CONTACT_FORM_SESSION_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;
const CONTACT_FORM_SESSION_ID_PATTERN = /^[A-Za-z0-9._~-]{16,128}$/u;
const locales = ['zh', 'en', 'ru'] as const;

type Locale = (typeof locales)[number];
type ApiErrorCode =
  | 'CAPTCHA_FAILED'
  | 'CAPTCHA_REQUIRED'
  | 'INVALID_CONTENT_TYPE'
  | 'INVALID_JSON'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const trustedProxyIpHeaderNames = ['cf-connecting-ip', 'x-real-ip', 'x-forwarded-for'] as const;

const trimString = (value: unknown) => (typeof value === 'string' ? value.trim() : value);
const emptyStringToUndefined = (value: unknown) => {
  const trimmed = trimString(value);

  return trimmed === '' ? undefined : trimmed;
};

const optionalText = (max: number) =>
  z.preprocess(emptyStringToUndefined, z.string().max(max).optional());

const optionalPhone = z.preprocess(
  emptyStringToUndefined,
  z.string().max(40).refine(isValidGlobalPhoneNumber, 'phone is invalid').optional(),
);

const requiredText = (min: number, max: number) =>
  z.preprocess(trimString, z.string().min(min).max(max));

const optionalBoolean = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true' || value === '1' || value === 'on';
  }

  return value;
}, z.boolean().optional());

const contactSubmissionSchema = z
  .object({
    inquiryType: z.enum(['message', 'franchise']).default('message'),
    name: requiredText(1, 80),
    company: optionalText(120),
    position: optionalText(120),
    phone: optionalPhone,
    mobile: optionalPhone,
    email: z.preprocess(emptyStringToUndefined, z.string().email().max(160)),
    country: optionalText(120),
    message: requiredText(2, 3000),
    product: optionalText(160),
    productSlug: optionalText(160),
    sourceUrl: optionalText(1000),
    sourceLocale: z.enum(locales).optional(),
    consentAccepted: optionalBoolean,
    consentAcceptedAt: z.preprocess(
      emptyStringToUndefined,
      z.string().datetime({ offset: true }).optional(),
    ),
    turnstileToken: optionalText(4096),
    captchaToken: optionalText(4096),
    website: optionalText(300),
    homepage: optionalText(300),
    companyWebsite: optionalText(300),
  })
  .strip()
  .superRefine((value, context) => {
    if (!value.phone && !value.mobile) {
      context.addIssue({
        code: 'custom',
        path: ['mobile'],
        message: 'phone is required',
      });
    }

    if (!value.consentAcceptedAt && value.consentAccepted !== true) {
      context.addIssue({
        code: 'custom',
        path: ['consentAcceptedAt'],
        message: 'consent is required',
      });
    }
  });

const turnstileResponseSchema = z
  .object({
    success: z.boolean().optional(),
    'error-codes': z.array(z.string()).optional(),
  })
  .passthrough();

type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;

function errorResponse(status: number, code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: details ? { code, message, details } : { code, message },
    },
    { status },
  );
}

function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'form';
    errors[field] ??= [];
    errors[field].push(issue.message);
  }

  return errors;
}

function getHeaderValue(request: NextRequest, name: string) {
  return request.headers.get(name)?.trim() || undefined;
}

function normalizeClientIp(value: string | undefined) {
  let candidate = value?.split(',')[0]?.trim().replace(/^"|"$/g, '');

  if (candidate?.startsWith('[')) {
    const closingBracketIndex = candidate.indexOf(']');
    candidate = candidate.slice(1, closingBracketIndex > 0 ? closingBracketIndex : undefined);
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

function getClientIp(request: NextRequest) {
  const platformIp = normalizeClientIp((request as { ip?: string }).ip);
  if (platformIp) {
    return platformIp;
  }

  if (!env.CONTACT_FORM_TRUST_PROXY_HEADERS) {
    return 'unknown';
  }

  for (const headerName of trustedProxyIpHeaderNames) {
    const headerIp = normalizeClientIp(getHeaderValue(request, headerName));
    if (headerIp) {
      return headerIp;
    }
  }

  return clientIpFromForwardedHeader(getHeaderValue(request, 'forwarded')) ?? 'unknown';
}

function checkRateLimit(key: string) {
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

function rateLimitKeyPart(value: string) {
  return createHash('sha256').update(value).digest('base64url').slice(0, 24);
}

function normalizeContactFormSessionId(value: string | undefined) {
  const candidate = value?.trim();

  return candidate && CONTACT_FORM_SESSION_ID_PATTERN.test(candidate) ? candidate : undefined;
}

function getContactFormSessionId(request: NextRequest) {
  return (
    normalizeContactFormSessionId(request.cookies.get(CONTACT_FORM_SESSION_COOKIE_NAME)?.value) ??
    randomUUID()
  );
}

function withContactFormSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(CONTACT_FORM_SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    maxAge: CONTACT_FORM_SESSION_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  });

  return response;
}

function checkContactFormRateLimit(request: NextRequest, ip: string, sessionId: string) {
  const sessionKeyPart = rateLimitKeyPart(sessionId);
  const userAgentKeyPart = rateLimitKeyPart(
    getHeaderValue(request, 'user-agent')?.slice(0, 500) ?? '',
  );
  const keys =
    ip === 'unknown'
      ? [`contact-form:session:${sessionKeyPart}:ua:${userAgentKeyPart}`]
      : [`contact-form:ip:${ip}`, `contact-form:session:${sessionKeyPart}:ua:${userAgentKeyPart}`];
  const results = keys.map((key) => checkRateLimit(key));

  return {
    allowed: results.every((result) => result.allowed),
    retryAfterSeconds: Math.max(...results.map((result) => result.retryAfterSeconds)),
  };
}

async function readBodyBytes(request: NextRequest) {
  const contentLength = Number(getHeaderValue(request, 'content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return {
      ok: false as const,
      response: errorResponse(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.'),
    };
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: true as const, bytes: new Uint8Array() };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();

      return {
        ok: false as const,
        response: errorResponse(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.'),
      };
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true as const, bytes };
}

async function readRequestBody(request: NextRequest) {
  const contentType = getHeaderValue(request, 'content-type')?.toLowerCase() ?? '';

  try {
    const bodyBytes = await readBodyBytes(request);
    if (!bodyBytes.ok) {
      return bodyBytes;
    }

    const boundedRequest = new Request(request.url, {
      body: bodyBytes.bytes,
      headers: request.headers,
      method: request.method,
    });

    if (contentType.includes('application/json')) {
      return { ok: true as const, body: (await boundedRequest.json()) as unknown };
    }

    if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await boundedRequest.formData();

      return { ok: true as const, body: Object.fromEntries(formData.entries()) };
    }
  } catch {
    return {
      ok: false as const,
      response: errorResponse(400, 'INVALID_JSON', 'Invalid form payload.'),
    };
  }

  return {
    ok: false as const,
    response: errorResponse(415, 'INVALID_CONTENT_TYPE', 'Submit the form as JSON or form data.'),
  };
}

function hasHoneypotValue(body: unknown) {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const record = body as Record<string, unknown>;

  return ['website', 'homepage', 'companyWebsite'].some((field) => {
    const value = record[field];

    return typeof value === 'string' && value.trim().length > 0;
  });
}

function isLocalOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);

    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

function allowedSourceOrigins(request: NextRequest) {
  const origins = new Set<string>();

  try {
    const siteOrigin = new URL(env.NEXT_PUBLIC_SITE_URL).origin;
    origins.add(siteOrigin);

    if (isLocalOrigin(siteOrigin) || isLocalOrigin(request.nextUrl.origin)) {
      origins.add(request.nextUrl.origin);
    }
  } catch {
    // env validation already guards this, but keep the URL boundary defensive.
  }

  return origins;
}

function safeSourceUrl(value: string | undefined, allowedOrigins: ReadonlySet<string>) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value, env.NEXT_PUBLIC_SITE_URL);
    if (!allowedOrigins.has(url.origin)) {
      return undefined;
    }

    return `${url.origin}${url.pathname}${url.search}`.slice(0, 1000);
  } catch {
    return undefined;
  }
}

function localeFromUrl(value: string | undefined): Locale | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value, env.NEXT_PUBLIC_SITE_URL);
    const segment = url.pathname.split('/').filter(Boolean)[0];

    return locales.includes(segment as Locale) ? (segment as Locale) : undefined;
  } catch {
    return undefined;
  }
}

function productFromUrl(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value, env.NEXT_PUBLIC_SITE_URL);

    return url.searchParams.get('product')?.trim() || undefined;
  } catch {
    return undefined;
  }
}

function normalizeTurnstileSecret(value: string) {
  const trimmed = value.trim();
  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];

  if (trimmed.length >= 2 && (firstChar === '"' || firstChar === "'") && firstChar === lastChar) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

async function verifyCaptcha(input: ContactSubmissionInput, ip: string) {
  if (!env.TURNSTILE_SECRET) {
    return { ok: true as const, skipped: true as const };
  }

  const turnstileSecret = normalizeTurnstileSecret(env.TURNSTILE_SECRET);
  if (!turnstileSecret) {
    return { ok: false as const, code: 'CAPTCHA_FAILED' as const };
  }

  const token = input.turnstileToken || input.captchaToken;
  if (!token) {
    return { ok: false as const, code: 'CAPTCHA_REQUIRED' as const };
  }

  const body = new URLSearchParams({
    response: token,
    secret: turnstileSecret,
  });

  if (ip !== 'unknown') {
    body.set('remoteip', ip);
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body,
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { ok: false as const, code: 'CAPTCHA_FAILED' as const };
    }

    const verification = turnstileResponseSchema.safeParse(await response.json());

    return verification.success && verification.data.success === true
      ? { ok: true as const, skipped: false as const }
      : { ok: false as const, code: 'CAPTCHA_FAILED' as const };
  } catch (error) {
    console.warn('[contact-form] captcha verification failed', {
      error: error instanceof Error ? error.message : 'Unknown captcha error',
    });

    return { ok: false as const, code: 'CAPTCHA_FAILED' as const };
  }
}

async function resolveProductRef(productKey: string | undefined) {
  if (!productKey) {
    return undefined;
  }

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        {
          or: [{ slug: { equals: productKey } }, { productId: { equals: productKey } }],
        },
        { _status: { equals: 'published' } },
      ],
    },
  });
  const document = result.docs[0] as { id?: unknown } | undefined;

  return typeof document?.id === 'string' || typeof document?.id === 'number'
    ? document.id
    : undefined;
}

export async function POST(request: NextRequest) {
  const parsedBody = await readRequestBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  if (hasHoneypotValue(parsedBody.body)) {
    console.warn('[contact-form] honeypot submission ignored');

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const inputResult = contactSubmissionSchema.safeParse(parsedBody.body);
  if (!inputResult.success) {
    return errorResponse(422, 'VALIDATION_ERROR', 'Please check the form fields.', {
      fields: fieldErrors(inputResult.error),
    });
  }

  const ip = getClientIp(request);
  const contactFormSessionId = getContactFormSessionId(request);
  const rateLimit = checkContactFormRateLimit(request, ip, contactFormSessionId);
  if (!rateLimit.allowed) {
    return withContactFormSessionCookie(
      NextResponse.json(
        {
          ok: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many submissions. Please try again later.',
          },
        },
        {
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
          status: 429,
        },
      ),
      contactFormSessionId,
    );
  }

  const input = inputResult.data;
  const captcha = await verifyCaptcha(input, ip);
  if (!captcha.ok) {
    return withContactFormSessionCookie(
      errorResponse(
        captcha.code === 'CAPTCHA_REQUIRED' ? 400 : 422,
        captcha.code,
        'Form verification failed. Please try again.',
      ),
      contactFormSessionId,
    );
  }

  const sourceOrigins = allowedSourceOrigins(request);
  const referer = safeSourceUrl(getHeaderValue(request, 'referer'), sourceOrigins);
  const sourceUrl = safeSourceUrl(input.sourceUrl, sourceOrigins) || referer;
  const sourceLocale =
    input.sourceLocale ||
    localeFromUrl(sourceUrl) ||
    localeFromUrl(referer) ||
    localeFromUrl(request.nextUrl.toString()) ||
    env.NEXT_PUBLIC_DEFAULT_LOCALE;
  const productKey =
    input.product ||
    input.productSlug ||
    productFromUrl(sourceUrl) ||
    productFromUrl(referer) ||
    request.nextUrl.searchParams.get('product')?.trim() ||
    undefined;

  try {
    const productRef = await resolveProductRef(productKey);
    const payload = await getPayloadClient();
    const phone = input.phone || input.mobile;
    const consentAcceptedAt =
      input.consentAcceptedAt || (input.consentAccepted ? new Date().toISOString() : undefined);
    const userAgent = getHeaderValue(request, 'user-agent');
    const data: Record<string, unknown> = {
      consentAcceptedAt,
      inquiryType: input.inquiryType,
      message: input.message,
      name: input.name,
      sourceLocale,
      status: 'new',
    };

    if (input.company) data.company = input.company;
    if (input.position) data.position = input.position;
    if (phone) data.phone = phone;
    if (input.email) data.email = input.email.toLowerCase();
    if (input.country) data.country = input.country;
    if (productRef) data.productRef = productRef;
    if (sourceUrl) data.sourceUrl = sourceUrl;
    if (ip !== 'unknown') data.ip = ip;
    if (userAgent) data.userAgent = userAgent.slice(0, 500);

    const submission = await payload.create({
      collection: 'form-submissions',
      data,
      overrideAccess: true,
    });

    const id = (submission as { id?: unknown }).id;

    return withContactFormSessionCookie(
      NextResponse.json(
        {
          ok: true,
          id: typeof id === 'string' || typeof id === 'number' ? String(id) : undefined,
        },
        { status: 201 },
      ),
      contactFormSessionId,
    );
  } catch (error) {
    console.error('[contact-form] failed to create submission', {
      error: error instanceof Error ? error.message : 'Unknown submission error',
    });

    return withContactFormSessionCookie(
      errorResponse(
        500,
        'SERVER_ERROR',
        'The form could not be submitted. Please try again later.',
      ),
      contactFormSessionId,
    );
  }
}

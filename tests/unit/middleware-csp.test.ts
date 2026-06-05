import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/middleware', async () => {
  const { NextResponse } = await vi.importActual<typeof import('next/server')>('next/server');

  return {
    default: () => (request: NextRequest) =>
      NextResponse.next({ request: { headers: request.headers } }),
  };
});

import proxy from '@/proxy';
import { CONTENT_SECURITY_POLICY_HEADER, CSP_NONCE_HEADER } from '@/lib/security/csp';

function request(pathname: string) {
  return new NextRequest(new URL(pathname, 'https://www.yourfield.example'));
}

function getDirective(policy: string, name: string) {
  return policy.split('; ').find((directive) => directive.startsWith(`${name} `));
}

describe('proxy CSP', () => {
  it('adds a nonce-based CSP to public page responses and request overrides', () => {
    const response = proxy(request('/zh/contact'));
    const policy = response.headers.get(CONTENT_SECURITY_POLICY_HEADER);
    const nonce = policy?.match(/'nonce-([^']+)'/)?.[1];
    const scriptSrc = policy ? getDirective(policy, 'script-src') : undefined;

    expect(policy).toBeTruthy();
    expect(scriptSrc).toContain("'self' 'nonce-");
    expect(scriptSrc).toContain('https://challenges.cloudflare.com');
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(nonce).toBeTruthy();
    expect(response.headers.get(`x-middleware-request-${CSP_NONCE_HEADER}`)).toBe(nonce);
    expect(response.headers.get('x-middleware-request-content-security-policy')).toBe(policy);
  });

  it('generates a fresh nonce for each page request', () => {
    const firstPolicy = proxy(request('/zh/contact')).headers.get(CONTENT_SECURITY_POLICY_HEADER);
    const secondPolicy = proxy(request('/zh/contact')).headers.get(CONTENT_SECURITY_POLICY_HEADER);
    const firstNonce = firstPolicy?.match(/'nonce-([^']+)'/)?.[1];
    const secondNonce = secondPolicy?.match(/'nonce-([^']+)'/)?.[1];

    expect(firstNonce).toBeTruthy();
    expect(secondNonce).toBeTruthy();
    expect(firstNonce).not.toBe(secondNonce);
  });

  it('covers the Next.js admin fallback without invoking locale routing', () => {
    const response = proxy(request('/admin'));
    const policy = response.headers.get(CONTENT_SECURITY_POLICY_HEADER);
    const nonce = policy?.match(/'nonce-([^']+)'/)?.[1];

    expect(policy ? getDirective(policy, 'script-src') : undefined).not.toContain(
      "'unsafe-inline'",
    );
    expect(response.headers.get(`x-middleware-request-${CSP_NONCE_HEADER}`)).toBe(nonce);
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
  });

  it('passes Payload API paths through without locale routing', () => {
    const response = proxy(request('/payload-api/users/me'));
    const policy = response.headers.get(CONTENT_SECURITY_POLICY_HEADER);
    const nonce = policy?.match(/'nonce-([^']+)'/)?.[1];

    expect(policy).toBeTruthy();
    expect(response.headers.get(`x-middleware-request-${CSP_NONCE_HEADER}`)).toBe(nonce);
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
  });

  it('adds shared-cache hints to normal public pages only', () => {
    const publicResponse = proxy(request('/zh/products'));
    const adminResponse = proxy(request('/admin'));
    const previewResponse = proxy(
      new NextRequest(new URL('/zh/products', 'https://www.yourfield.example'), {
        headers: { cookie: '__prerender_bypass=preview' },
      }),
    );
    const searchResponse = proxy(request('/zh/search'));

    expect(publicResponse.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
    );
    expect(adminResponse.headers.get('Cache-Control')).toBeNull();
    expect(previewResponse.headers.get('Cache-Control')).toBeNull();
    expect(searchResponse.headers.get('Cache-Control')).toBeNull();
  });
});

import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { createPayloadPrivateRouteProtection } from '@/lib/payload/privateRouteProtection';

const baseEnv = {
  NODE_ENV: 'development',
  PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_PASSWORD: undefined,
  PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_USER: undefined,
  PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION: false,
  PAYLOAD_PRIVATE_ROUTES_IP_ALLOWLIST: undefined,
  PAYLOAD_PRIVATE_ROUTES_TRUST_PROXY_HEADERS: false,
  PAYLOAD_PUBLIC_ADMIN_PATH: '/admin',
  PAYLOAD_PUBLIC_API_PATH: '/payload-api',
  PAYLOAD_PUBLIC_GRAPHQL_PATH: '/payload-graphql',
  PAYLOAD_PUBLIC_GRAPHQL_PLAYGROUND_PATH: '/payload-graphql-playground',
} as const;

type EnvOverrides = Partial<Parameters<typeof createPayloadPrivateRouteProtection>[0]>;

function makeMiddleware(overrides: EnvOverrides = {}) {
  return createPayloadPrivateRouteProtection({
    ...baseEnv,
    ...overrides,
  });
}

function makeRequest(originalUrl: string, authorization?: string) {
  return {
    headers: authorization ? { authorization } : {},
    originalUrl,
    socket: {
      remoteAddress: '127.0.0.1',
    },
  } as unknown as Request;
}

function makeResponse() {
  const response = {
    send: vi.fn(() => response),
    setHeader: vi.fn(),
    status: vi.fn(() => response),
  } as unknown as Response & {
    send: ReturnType<typeof vi.fn>;
    setHeader: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };

  return response;
}

function basicAuth(user: string, password: string) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
}

type NextMock = ReturnType<typeof vi.fn<Parameters<NextFunction>, ReturnType<NextFunction>>> &
  NextFunction;

function makeNext(): NextMock {
  return vi.fn<Parameters<NextFunction>, ReturnType<NextFunction>>() as NextMock;
}

describe('Payload private route protection', () => {
  it('allows public routes without checking private-route protection', () => {
    const next = makeNext();
    const response = makeResponse();

    makeMiddleware()(makeRequest('/zh/products'), response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });

  it('lets local development reach the Payload login page when no private protection is configured', () => {
    const next = makeNext();
    const response = makeResponse();

    makeMiddleware()(makeRequest('/admin'), response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });

  it('fails closed in production if private routes are not protected', () => {
    const next = makeNext();
    const response = makeResponse();

    makeMiddleware({ NODE_ENV: 'production' })(makeRequest('/admin'), response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.send).toHaveBeenCalledWith(
      'Payload private route protection is not configured.',
    );
  });

  it('keeps Basic Auth in front of private routes when configured', () => {
    const next = makeNext();
    const response = makeResponse();

    makeMiddleware({
      PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_PASSWORD: 'secret-password',
      PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_USER: 'admin',
    })(makeRequest('/admin', basicAuth('admin', 'secret-password')), response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });
});

import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

import type { NextFunction, Request, Response } from 'express';

import type { env } from '../env';

type PayloadPrivateRouteEnv = Pick<
  typeof env,
  | 'PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_PASSWORD'
  | 'PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_USER'
  | 'PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION'
  | 'PAYLOAD_PRIVATE_ROUTES_IP_ALLOWLIST'
  | 'PAYLOAD_PRIVATE_ROUTES_TRUST_PROXY_HEADERS'
  | 'PAYLOAD_PUBLIC_ADMIN_PATH'
  | 'PAYLOAD_PUBLIC_API_PATH'
  | 'PAYLOAD_PUBLIC_GRAPHQL_PATH'
  | 'PAYLOAD_PUBLIC_GRAPHQL_PLAYGROUND_PATH'
>;

const normalizePath = (value: string) => {
  const path = value.startsWith('/') ? value : `/${value}`;
  return path.replace(/\/+$/g, '') || '/';
};

const isPrivateRoute = (pathname: string, protectedRoots: readonly string[]) =>
  protectedRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`));

const firstHeaderValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0]?.split(',')[0]?.trim();
  }

  return value?.split(',')[0]?.trim();
};

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const parseBasicAuth = (header: string | undefined) => {
  if (!header?.startsWith('Basic ')) {
    return null;
  }

  const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');

  if (separatorIndex === -1) {
    return null;
  }

  return {
    password: decoded.slice(separatorIndex + 1),
    user: decoded.slice(0, separatorIndex),
  };
};

const parseAllowlist = (value: string | undefined) =>
  new Set(
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => isIP(item)),
  );

const clientIp = (request: Request, trustProxyHeaders: boolean) => {
  if (trustProxyHeaders) {
    return (
      firstHeaderValue(request.headers['cf-connecting-ip']) ??
      firstHeaderValue(request.headers['x-real-ip']) ??
      firstHeaderValue(request.headers['x-forwarded-for']) ??
      request.socket.remoteAddress
    );
  }

  return request.socket.remoteAddress;
};

export function createPayloadPrivateRouteProtection(envValues: PayloadPrivateRouteEnv) {
  const protectedRoots = [
    envValues.PAYLOAD_PUBLIC_ADMIN_PATH,
    envValues.PAYLOAD_PUBLIC_API_PATH,
    envValues.PAYLOAD_PUBLIC_GRAPHQL_PATH,
    envValues.PAYLOAD_PUBLIC_GRAPHQL_PLAYGROUND_PATH,
  ].map(normalizePath);

  const allowlist = parseAllowlist(envValues.PAYLOAD_PRIVATE_ROUTES_IP_ALLOWLIST);
  const basicUser = envValues.PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_USER;
  const basicPassword = envValues.PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_PASSWORD;
  const hasBasicAuth = Boolean(basicUser && basicPassword);

  return (request: Request, response: Response, next: NextFunction) => {
    const pathname = new URL(request.originalUrl, 'http://localhost').pathname;

    if (!isPrivateRoute(pathname, protectedRoots)) {
      next();
      return;
    }

    if (envValues.PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION && !hasBasicAuth && !allowlist.size) {
      next();
      return;
    }

    const ip = clientIp(request, envValues.PAYLOAD_PRIVATE_ROUTES_TRUST_PROXY_HEADERS);
    if (ip && allowlist.has(ip)) {
      next();
      return;
    }

    const credentials = parseBasicAuth(firstHeaderValue(request.headers.authorization));
    if (
      credentials &&
      basicUser &&
      basicPassword &&
      safeEqual(credentials.user, basicUser) &&
      safeEqual(credentials.password, basicPassword)
    ) {
      next();
      return;
    }

    response.setHeader('WWW-Authenticate', 'Basic realm="YourField Payload"');
    response.status(401).send('Payload admin access is restricted.');
  };
}

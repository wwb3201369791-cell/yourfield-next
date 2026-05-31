import { afterEach, describe, expect, it, vi } from 'vitest';

const protectedProductionSecrets = [
  'CRON_SECRET',
  'REVALIDATE_SECRET',
  'PAYLOAD_PREVIEW_SECRET',
] as const;
const requiredProductionEnvKeys = [
  'PAYLOAD_SECRET',
  'DATABASE_URI',
  ...protectedProductionSecrets,
] as const;

const productionBaseEnv = {
  DATABASE_URI: 'postgresql://postgres@localhost:5432/yourfield_dev',
  NODE_ENV: 'production',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-turnstile-site-key',
  PAYLOAD_SECRET: 'test-payload-secret-32-characters-long',
  TURNSTILE_SECRET: 'test-turnstile-secret',
};

type EnvImport = {
  env: {
    CRON_SECRET?: string;
    NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
    NODE_ENV: 'development' | 'production' | 'test';
    PAYLOAD_PREVIEW_SECRET?: string;
    REVALIDATE_SECRET?: string;
    SKIP_ENV_VALIDATION: boolean;
    TURNSTILE_SECRET?: string;
  };
};

async function importEnvWith(overrides: Record<string, string>) {
  vi.resetModules();

  Object.entries({
    ...productionBaseEnv,
    ...overrides,
  }).forEach(([key, value]) => {
    vi.stubEnv(key, value);
  });

  return import('@/lib/env') as Promise<EnvImport>;
}

describe('environment validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('requires explicit database and secret configuration in production', async () => {
    const error = await importEnvWith({
      DATABASE_URI: '',
      PAYLOAD_SECRET: '',
      TURNSTILE_SECRET: '',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '',
      CRON_SECRET: '',
      REVALIDATE_SECRET: '',
      PAYLOAD_PREVIEW_SECRET: '',
    }).then(
      () => undefined,
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(Error);

    const message = error instanceof Error ? error.message : '';
    requiredProductionEnvKeys.forEach((envName) => {
      expect(message).toContain(`${envName} is required in production`);
    });
  });

  it('allows production startup without Turnstile keys when other required secrets are configured', async () => {
    const { env } = await importEnvWith({
      CRON_SECRET: 'test-cron-secret',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '',
      PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION: 'true',
      REVALIDATE_SECRET: 'test-revalidate-secret',
      PAYLOAD_PREVIEW_SECRET: 'test-preview-secret',
      TURNSTILE_SECRET: '',
    });

    expect(env.CRON_SECRET).toBe('test-cron-secret');
    expect(env.REVALIDATE_SECRET).toBe('test-revalidate-secret');
    expect(env.PAYLOAD_PREVIEW_SECRET).toBe('test-preview-secret');
    expect(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY).toBeUndefined();
    expect(env.TURNSTILE_SECRET).toBeUndefined();
  });

  it('rejects Cloudflare Turnstile dummy keys on production domains', async () => {
    const error = await importEnvWith({
      CRON_SECRET: 'test-cron-secret',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION: 'true',
      PAYLOAD_PREVIEW_SECRET: 'test-preview-secret',
      REVALIDATE_SECRET: 'test-revalidate-secret',
      TURNSTILE_SECRET: '1x0000000000000000000000000000000AA',
    }).then(
      () => undefined,
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(Error);
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain(
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY must not use a Cloudflare Turnstile test site key in production',
    );
    expect(message).toContain(
      'TURNSTILE_SECRET must not use a Cloudflare Turnstile test secret key in production',
    );
  });

  it('allows production startup when internal webhook secrets are configured', async () => {
    const { env } = await importEnvWith({
      CRON_SECRET: 'test-cron-secret',
      PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION: 'true',
      REVALIDATE_SECRET: 'test-revalidate-secret',
      PAYLOAD_PREVIEW_SECRET: 'test-preview-secret',
    });

    expect(env.CRON_SECRET).toBe('test-cron-secret');
    expect(env.REVALIDATE_SECRET).toBe('test-revalidate-secret');
    expect(env.PAYLOAD_PREVIEW_SECRET).toBe('test-preview-secret');
  });

  it('requires production Payload private routes to have explicit protection', async () => {
    const error = await importEnvWith({
      CRON_SECRET: 'test-cron-secret',
      PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION: 'false',
      PAYLOAD_PRIVATE_ROUTES_IP_ALLOWLIST: '',
      PAYLOAD_PREVIEW_SECRET: 'test-preview-secret',
      REVALIDATE_SECRET: 'test-revalidate-secret',
    }).then(
      () => undefined,
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error instanceof Error ? error.message : '').toContain(
      'Production must protect /admin and Payload API routes',
    );
  });

  it('allows explicit validation skips for temporary production build-only secrets', async () => {
    const { env } = await importEnvWith({
      DATABASE_URI: '',
      PAYLOAD_SECRET: 'test-payload-secret-32-characters-long',
      TURNSTILE_SECRET: '',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '',
      CRON_SECRET: '',
      REVALIDATE_SECRET: '',
      PAYLOAD_PREVIEW_SECRET: '',
      SKIP_ENV_VALIDATION: 'true',
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.SKIP_ENV_VALIDATION).toBe(true);
  });

  it('still requires the Payload secret when validation is skipped', async () => {
    const error = await importEnvWith({
      PAYLOAD_SECRET: '',
      SKIP_ENV_VALIDATION: 'true',
    }).then(
      () => undefined,
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error instanceof Error ? error.message : '').toContain(
      'PAYLOAD_SECRET is required in production',
    );
  });

  it('keeps admin interface language limited to Chinese and English', async () => {
    const error = await importEnvWith({
      PAYLOAD_ADMIN_LOCALE: 'ru',
    }).then(
      () => undefined,
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error instanceof Error ? error.message : '').toContain('PAYLOAD_ADMIN_LOCALE');
  });
});

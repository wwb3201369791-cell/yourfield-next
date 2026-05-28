import { afterEach, describe, expect, it, vi } from 'vitest';

const protectedProductionSecrets = [
  'CRON_SECRET',
  'REVALIDATE_SECRET',
  'PAYLOAD_PREVIEW_SECRET',
] as const;
const requiredProductionEnvKeys = [
  'PAYLOAD_SECRET',
  'DATABASE_URI',
  'TURNSTILE_SECRET',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  ...protectedProductionSecrets,
] as const;

const productionBaseEnv = {
  DATABASE_URI: 'postgresql://postgres:password@localhost:5432/yourfield_dev',
  NODE_ENV: 'production',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-turnstile-site-key',
  PAYLOAD_SECRET: 'test-payload-secret-32-characters-long',
  TURNSTILE_SECRET: 'test-turnstile-secret',
};

async function importEnvWith(overrides: Record<string, string>) {
  vi.resetModules();

  Object.entries({
    ...productionBaseEnv,
    ...overrides,
  }).forEach(([key, value]) => {
    vi.stubEnv(key, value);
  });

  return import('@/lib/env');
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

  it('allows production startup when internal webhook secrets are configured', async () => {
    await expect(
      importEnvWith({
        CRON_SECRET: 'test-cron-secret',
        REVALIDATE_SECRET: 'test-revalidate-secret',
        PAYLOAD_PREVIEW_SECRET: 'test-preview-secret',
      }),
    ).resolves.toMatchObject({
      env: expect.objectContaining({
        CRON_SECRET: 'test-cron-secret',
        REVALIDATE_SECRET: 'test-revalidate-secret',
        PAYLOAD_PREVIEW_SECRET: 'test-preview-secret',
      }),
    });
  });
});

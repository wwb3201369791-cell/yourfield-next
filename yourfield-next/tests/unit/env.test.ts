import { afterEach, describe, expect, it, vi } from 'vitest';

const protectedProductionSecrets = [
  'CRON_SECRET',
  'REVALIDATE_SECRET',
  'PAYLOAD_PREVIEW_SECRET',
] as const;

const productionBaseEnv = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-turnstile-site-key',
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

  it('requires internal webhook secrets in production', async () => {
    const error = await importEnvWith({
      CRON_SECRET: '',
      REVALIDATE_SECRET: '',
      PAYLOAD_PREVIEW_SECRET: '',
    }).then(
      () => undefined,
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(Error);

    const message = error instanceof Error ? error.message : '';

    protectedProductionSecrets.forEach((secretName) => {
      expect(message).toContain(`${secretName} is required in production`);
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

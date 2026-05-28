import { afterEach, describe, expect, it, vi } from 'vitest';

const s3StorageEnv = {
  S3_ACCESS_KEY_ID: 'test-access-key',
  S3_BUCKET: 'yourfield-assets',
  S3_ENDPOINT: 'https://s3.example.com',
  S3_REGION: 'auto',
  S3_SECRET_ACCESS_KEY: 'test-secret-key',
} as const;

async function importResolver(publicUrlBase: string | undefined) {
  vi.resetModules();
  vi.unstubAllEnvs();

  for (const [key, value] of Object.entries(s3StorageEnv)) {
    vi.stubEnv(key, value);
  }

  vi.stubEnv('S3_PUBLIC_URL_BASE', publicUrlBase ?? '');

  const module = await import('@/lib/media/publicAsset');

  return module.resolvePublicAssetUrl;
}

describe('resolvePublicAssetUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('keeps local asset paths when no public base is configured', async () => {
    const resolvePublicAssetUrl = await importResolver(undefined);

    expect(resolvePublicAssetUrl('/video/about.mp4')).toBe('/video/about.mp4');
  });

  it('rewrites local asset paths to the configured public base', async () => {
    const resolvePublicAssetUrl = await importResolver('https://cdn.example.com/media/');

    expect(resolvePublicAssetUrl('/video/home/hero-campus-background-loop.mp4')).toBe(
      'https://cdn.example.com/media/video/home/hero-campus-background-loop.mp4',
    );
  });

  it('leaves absolute URLs untouched', async () => {
    const resolvePublicAssetUrl = await importResolver('https://cdn.example.com/media/');

    expect(resolvePublicAssetUrl('https://media.example.com/video/about.mp4')).toBe(
      'https://media.example.com/video/about.mp4',
    );
  });
});

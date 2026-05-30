import { describe, expect, it } from 'vitest';

import nextConfig, {
  defaultBuildWorkerCount,
  getBuildWorkerCount,
  remotePatternFromUrl,
  serverComponentsExternalPackages,
} from '../../next.config';

describe('next config security headers', () => {
  it('keeps the development indicator out of local click testing', () => {
    expect(nextConfig.devIndicators).toBe(false);
  });

  it('leaves CSP to middleware so production pages can receive request nonces', async () => {
    expect(nextConfig.headers).toBeTypeOf('function');

    const routes = await nextConfig.headers?.();
    const headerKeys = routes?.flatMap((route) => route.headers.map((header) => header.key)) ?? [];

    expect(headerKeys).not.toContain('Content-Security-Policy');
  });
});

describe('next config build worker override', () => {
  it('uses a constrained default worker count when the override is not set', () => {
    expect(defaultBuildWorkerCount).toBe(1);
    expect(getBuildWorkerCount(undefined)).toBe(defaultBuildWorkerCount);
    expect(getBuildWorkerCount('')).toBe(defaultBuildWorkerCount);
  });

  it('accepts positive integer worker counts for constrained local builds', () => {
    expect(getBuildWorkerCount('1')).toBe(1);
    expect(getBuildWorkerCount('2')).toBe(2);
  });

  it('ignores invalid values', () => {
    expect(getBuildWorkerCount('0')).toBeUndefined();
    expect(getBuildWorkerCount('-1')).toBeUndefined();
    expect(getBuildWorkerCount('workers')).toBeUndefined();
  });

  it('builds a remote image pattern from the configured public S3 URL', () => {
    expect(remotePatternFromUrl('https://cdn.example.com/yourfield-assets/')).toEqual({
      hostname: 'cdn.example.com',
      pathname: '/yourfield-assets/**',
      port: '',
      protocol: 'https',
    });
    expect(remotePatternFromUrl('not a url')).toBeNull();
  });

  it('keeps pinyin-pro external to avoid missing dev vendor chunks', () => {
    expect(serverComponentsExternalPackages).toContain('pinyin-pro');
  });
});

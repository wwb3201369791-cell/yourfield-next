import { describe, expect, it } from 'vitest';

// @ts-expect-error next.config.js intentionally stays as the runtime Next.js config file.
import { getBuildWorkerCount, remotePatternFromUrl, serverComponentsExternalPackages } from '../../next.config';

describe('next config build worker override', () => {
  it('keeps the default Next.js worker count when the override is not set', () => {
    expect(getBuildWorkerCount(undefined)).toBeUndefined();
    expect(getBuildWorkerCount('')).toBeUndefined();
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

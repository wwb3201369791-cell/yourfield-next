import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://www.yourfield.example',
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('buildPageMetadata', () => {
  it('does not inject a static OpenGraph/Twitter image when the CMS page has no image', async () => {
    const { buildPageMetadata } = await import('@/lib/seo/buildMetadata');

    const metadata = buildPageMetadata({
      description: 'CMS description',
      locale: 'zh',
      path: '/contact',
      title: 'CMS title',
    });

    expect(metadata.openGraph).toEqual(
      expect.not.objectContaining({
        images: expect.anything(),
      }),
    );
    expect(metadata.twitter).toEqual(
      expect.not.objectContaining({
        images: expect.anything(),
      }),
    );
  });
});

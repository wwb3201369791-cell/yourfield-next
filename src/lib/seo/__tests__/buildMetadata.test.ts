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

  it('trims titles and descriptions and falls back to the localized site name for blank titles', async () => {
    const { buildPageMetadata } = await import('@/lib/seo/buildMetadata');

    const metadata = buildPageMetadata({
      description: '  Search summary  ',
      locale: 'en',
      path: '/products',
      title: '   ',
    });

    expect(metadata.title).toBe('YourField Group');
    expect(metadata.description).toBe('Search summary');
    expect(metadata.openGraph).toMatchObject({
      description: 'Search summary',
      title: 'YourField Group',
    });
    expect(metadata.twitter).toMatchObject({
      description: 'Search summary',
      title: 'YourField Group',
    });
  });

  it('uses CMS canonical and keywords when provided', async () => {
    const { buildPageMetadata } = await import('@/lib/seo/buildMetadata');

    const metadata = buildPageMetadata({
      canonical: '/canonical-products',
      description: 'Products summary',
      keywords: ['protective clothing', 'fire suit'],
      locale: 'zh',
      path: '/products',
      title: 'Products',
    });

    expect(metadata.alternates?.canonical).toBe('https://www.yourfield.example/canonical-products');
    expect(metadata.openGraph).toMatchObject({
      url: 'https://www.yourfield.example/canonical-products',
    });
    expect(metadata.keywords).toEqual(['protective clothing', 'fire suit']);
  });

  it('falls back to the localized URL when CMS canonical is invalid', async () => {
    const { buildPageMetadata } = await import('@/lib/seo/buildMetadata');

    const metadata = buildPageMetadata({
      canonical: 'https://[bad-url',
      description: 'News summary',
      locale: 'ru',
      path: '/news/launch',
      title: 'Launch',
    });

    expect(metadata.alternates?.canonical).toBe('https://www.yourfield.example/ru/news/launch');
  });
});

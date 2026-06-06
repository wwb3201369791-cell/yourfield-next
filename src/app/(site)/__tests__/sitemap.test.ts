import { describe, expect, it } from 'vitest';

import { toSitemapContentItem } from '../sitemap';

describe('site sitemap helpers', () => {
  it('excludes CMS documents that explicitly opt out of indexing', () => {
    expect(
      toSitemapContentItem({
        seo: { noindex: true },
        slug: 'hidden-product',
        updatedAt: '2026-06-01T00:00:00.000Z',
      }),
    ).toBeNull();
  });

  it('keeps visible CMS documents and preserves valid last modified dates', () => {
    expect(
      toSitemapContentItem({
        seo: { noindex: false },
        slug: 'visible-product',
        updatedAt: '2026-06-01T00:00:00.000Z',
      }),
    ).toEqual({
      lastModified: new Date('2026-06-01T00:00:00.000Z'),
      slug: 'visible-product',
    });
  });
});

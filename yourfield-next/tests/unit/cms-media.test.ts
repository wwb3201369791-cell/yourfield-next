import { describe, expect, it } from 'vitest';

import { normalizeCmsMediaUrl } from '@/lib/cms/media';

describe('normalizeCmsMediaUrl', () => {
  it('uses the stable brand logo asset for seeded official logo media URLs', () => {
    expect(
      normalizeCmsMediaUrl(
        '/media/yourfield-logo-official-b-5.webp',
        '/images/brand/yourfield-logo-official-b.png',
      ),
    ).toBe('/images/brand/yourfield-logo-official-b.png');

    expect(
      normalizeCmsMediaUrl(
        'http://localhost:3003/media/yourfield-logo-official-a-4.webp',
        '/images/brand/yourfield-logo-official-a.png',
      ),
    ).toBe('/images/brand/yourfield-logo-official-a.png');
  });

  it('keeps non-logo CMS media URLs unchanged', () => {
    expect(
      normalizeCmsMediaUrl(
        '/media/modeling-jacket-front-5.webp',
        '/images/products/firefighter-protective-suit/modeling-jacket-front.png',
      ),
    ).toBe('/media/modeling-jacket-front-5.webp');
  });
});

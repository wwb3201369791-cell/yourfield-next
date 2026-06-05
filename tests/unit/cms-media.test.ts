import { describe, expect, it } from 'vitest';

import { mediaPayload3UploadColumnsSql } from '@/migrations/20260530_030000_media_payload3_upload_columns';
import { normalizeCmsMediaUrl, selectCmsMediaUrl } from '@/lib/cms/media';

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
        '/images/headers/products-center.png',
      ),
    ).toBe('/media/modeling-jacket-front-5.webp');
  });

  it('normalizes absolute server media URLs to same-origin paths', () => {
    expect(normalizeCmsMediaUrl('http://localhost:3000/media/arc-flash-suit-001.png', '')).toBe(
      '/media/arc-flash-suit-001.png',
    );
  });

  it('prefers original CMS media URLs over generated sizes for product material images', () => {
    expect(
      selectCmsMediaUrl({
        url: '/media/new-product-1.png',
        sizes: {
          card: { url: '/media/new-product-1-600x400.webp' },
        },
      }),
    ).toBe('/media/new-product-1.png');
  });

  it('adds a media document version to local upload URLs so restored files bypass stale immutable caches', () => {
    expect(
      selectCmsMediaUrl({
        updatedAt: '2026-06-05T14:00:00.000Z',
        url: '/media/new-product-1.png',
        sizes: {
          card: { url: '/media/new-product-1-600x400.webp' },
        },
      }),
    ).toBe('/media/new-product-1.png?v=1780668000000');
  });

  it('keeps Payload 3 media upload metadata columns covered by migrations', () => {
    expect(mediaPayload3UploadColumnsSql).toContain(
      'ADD COLUMN IF NOT EXISTS "thumbnail_u_r_l" varchar',
    );
    expect(mediaPayload3UploadColumnsSql).toContain(
      'ADD COLUMN IF NOT EXISTS "sizes_thumbnail_url" varchar',
    );
    expect(mediaPayload3UploadColumnsSql).toContain(
      'ADD COLUMN IF NOT EXISTS "sizes_card_filename" varchar',
    );
    expect(mediaPayload3UploadColumnsSql).toContain(
      'ADD COLUMN IF NOT EXISTS "sizes_og_filesize" numeric',
    );
  });
});

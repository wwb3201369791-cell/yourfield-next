import { describe, expect, it } from 'vitest';

import { productsDirectVideoColumnSql } from '@/migrations/20260530_060000_products_direct_video_column';

describe('products direct video column migration', () => {
  it('adds Payload 3 direct upload columns for product video fields', () => {
    expect(productsDirectVideoColumnSql).toContain(
      'ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "video_id" integer',
    );
    expect(productsDirectVideoColumnSql).toContain(
      'ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_video_id" integer',
    );
    expect(productsDirectVideoColumnSql).toContain('"products_video_id_media_id_fk"');
  });

  it('backfills existing product videos from relation paths when present', () => {
    expect(productsDirectVideoColumnSql).toContain('product_rel."path" = \'video\'');
    expect(productsDirectVideoColumnSql).toContain(
      'product."video_id" IS DISTINCT FROM product_rel."media_id"',
    );
  });
});

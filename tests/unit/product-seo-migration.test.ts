import { describe, expect, it } from 'vitest';

import { productSeoColumnsSql } from '@/migrations/20260606_031000_product_seo_columns';

describe('product SEO migration', () => {
  it('adds Payload SEO columns for products and localized product content', () => {
    expect(productSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean',
    );
    expect(productSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "seo_canonical" varchar',
    );
    expect(productSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer',
    );
    expect(productSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "products_locales" ADD COLUMN IF NOT EXISTS "seo_title" varchar',
    );
    expect(productSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "products_locales" ADD COLUMN IF NOT EXISTS "seo_description" varchar',
    );
    expect(productSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "products_locales" ADD COLUMN IF NOT EXISTS "seo_keywords" varchar',
    );
  });

  it('adds version columns and backfills existing SEO image relation rows', () => {
    expect(productSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_seo_og_image_id" integer',
    );
    expect(productSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "_products_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_title" varchar',
    );
    expect(productSeoColumnsSql).toContain('product_rel."path" = \'seo.ogImage\'');
    expect(productSeoColumnsSql).toContain('"products_seo_og_image_id_media_id_fk"');
  });
});

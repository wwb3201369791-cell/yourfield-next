import { describe, expect, it } from 'vitest';

import { productsUploadFieldColumnsSql } from '@/migrations/20260530_040000_products_upload_field_columns';

describe('products upload field migration', () => {
  it('adds Payload 3 upload columns for product image and attachment arrays', () => {
    expect(productsUploadFieldColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "products_images" ADD COLUMN IF NOT EXISTS "file_id" integer',
    );
    expect(productsUploadFieldColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "products_visual_groups_images" ADD COLUMN IF NOT EXISTS "file_id" integer',
    );
    expect(productsUploadFieldColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "products_selling_points" ADD COLUMN IF NOT EXISTS "icon_id" integer',
    );
    expect(productsUploadFieldColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "products_certifications" ADD COLUMN IF NOT EXISTS "attachment_id" integer',
    );
    expect(productsUploadFieldColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "products_quality_evidence" ADD COLUMN IF NOT EXISTS "attachment_id" integer',
    );
  });

  it('backfills existing product image rows from relation paths instead of placeholders', () => {
    expect(productsUploadFieldColumnsSql).toContain(
      'product_rel."path" = (\'images.\' || (product_image."_order" - 1)::text || \'.file\')',
    );
    expect(productsUploadFieldColumnsSql).toContain(
      '\'visualGroups.\'\n    || (visual_group."_order" - 1)::text',
    );
    expect(productsUploadFieldColumnsSql).toContain(
      'ALTER TABLE "products_images" ALTER COLUMN "file_id" SET NOT NULL',
    );
    expect(productsUploadFieldColumnsSql).toContain(
      'ALTER TABLE "products_visual_groups_images" ALTER COLUMN "file_id" SET NOT NULL',
    );
  });
});

import { describe, expect, it } from 'vitest';

import { productsDirectProductGroupColumnSql } from '@/migrations/20260530_050000_products_direct_product_group_column';

describe('products direct product group column migration', () => {
  it('adds Payload 3 direct relationship columns for product groups', () => {
    expect(productsDirectProductGroupColumnSql).toContain(
      'ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "product_group_id" integer',
    );
    expect(productsDirectProductGroupColumnSql).toContain(
      'ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_product_group_id" integer',
    );
    expect(productsDirectProductGroupColumnSql).toContain(
      '"products_product_group_id_product_groups_id_fk"',
    );
  });

  it('backfills existing product group assignments from the relation table', () => {
    expect(productsDirectProductGroupColumnSql).toContain('product_rel."path" = \'productGroup\'');
    expect(productsDirectProductGroupColumnSql).toContain(
      'product."product_group_id" IS DISTINCT FROM product_rel."product_groups_id"',
    );
  });
});

import { describe, expect, it } from 'vitest';

import { backfillProductDisplayOrderByGroupSql } from '@/migrations/20260531_090000_backfill_product_display_order_by_group';

describe('product display order by group migration', () => {
  it('backfills zero or missing product display orders within each product group', () => {
    expect(backfillProductDisplayOrderByGroupSql).toContain('PARTITION BY product_group_sort_id');
    expect(backfillProductDisplayOrderByGroupSql).toContain('product."display_order" IS NULL');
    expect(backfillProductDisplayOrderByGroupSql).toContain('product."display_order" <= 0');
    expect(backfillProductDisplayOrderByGroupSql).toContain(
      'COALESCE(product."product_id", product."slug", product."model", product."id"::text)',
    );
    expect(backfillProductDisplayOrderByGroupSql).toContain(
      'group_max_display_order.max_display_order + missing_display_order.generated_display_order',
    );
  });

  it('keeps existing positive display orders as the base for generated positions', () => {
    expect(backfillProductDisplayOrderByGroupSql).toContain(
      'MAX(product_group_members."display_order") FILTER (WHERE product_group_members."display_order" > 0)',
    );
    expect(backfillProductDisplayOrderByGroupSql).toContain('UPDATE "products" AS product');
    expect(backfillProductDisplayOrderByGroupSql).toMatch(
      /SET\s+"display_order" = group_max_display_order\.max_display_order \+ missing_display_order\.generated_display_order/,
    );
  });
});

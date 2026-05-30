import { describe, expect, it } from 'vitest';

import { pruneEmptyProductDraftsSql } from '@/migrations/20260530_191000_prune_empty_product_drafts';

describe('empty product draft cleanup migration', () => {
  it('only deletes draft rows with no identifying product data or relationships', () => {
    expect(pruneEmptyProductDraftsSql).toContain('DELETE FROM "_products_v"');
    expect(pruneEmptyProductDraftsSql).toContain('product_version."parent_id" IS NULL');
    expect(pruneEmptyProductDraftsSql).toContain('FROM "_products_v_rels"');
    expect(pruneEmptyProductDraftsSql).toContain('DELETE FROM "products"');
    expect(pruneEmptyProductDraftsSql).toContain('product."_status" = \'draft\'');
    expect(pruneEmptyProductDraftsSql).toContain('product."product_id"');
    expect(pruneEmptyProductDraftsSql).toContain('FROM "products_locales"');
    expect(pruneEmptyProductDraftsSql).toContain('product_locale."name"');
    expect(pruneEmptyProductDraftsSql).toContain('product."product_group_id" IS NULL');
    expect(pruneEmptyProductDraftsSql).toContain('FROM "products_rels"');
    expect(pruneEmptyProductDraftsSql).toContain('FROM "products_images"');
  });
});

import { describe, expect, it } from 'vitest';

import { pageBlockDirectRelationshipColumnsSql } from '@/migrations/20260530_110000_page_block_direct_relationship_columns';

describe('page block direct relationship migration', () => {
  it('adds direct media and category columns for Payload 3 page blocks', () => {
    expect(pageBlockDirectRelationshipColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "pages_blocks_media_text" ADD COLUMN IF NOT EXISTS "media_id"',
    );
    expect(pageBlockDirectRelationshipColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "pages_blocks_product_showcase" ADD COLUMN IF NOT EXISTS "category_id"',
    );
    expect(pageBlockDirectRelationshipColumnsSql).toContain(
      'page_rel."path" = \'blocks.\' || block."_order" || \'.media\'',
    );
    expect(pageBlockDirectRelationshipColumnsSql).toContain(
      'page_rel."path" = \'blocks.\' || block."_order" || \'.category\'',
    );
    expect(pageBlockDirectRelationshipColumnsSql).toContain(
      'pages_blocks_media_text_media_id_media_id_fk',
    );
    expect(pageBlockDirectRelationshipColumnsSql).toContain(
      'pages_blocks_product_showcase_category_id_product_categories_id_fk',
    );
  });
});

import { describe, expect, it } from 'vitest';

import { remainingDirectMediaColumnsSql } from '@/migrations/20260530_080000_remaining_direct_media_columns';

describe('remaining direct media and relationship migration', () => {
  it('adds direct columns for product groups, categories, and pages', () => {
    expect(remainingDirectMediaColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "product_groups" ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer',
    );
    expect(remainingDirectMediaColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "product_categories" ADD COLUMN IF NOT EXISTS "product_group_id" integer',
    );
    expect(remainingDirectMediaColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "pages" ADD COLUMN IF NOT EXISTS "hero_background_image_id" integer',
    );
    expect(remainingDirectMediaColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "_pages_v" ADD COLUMN IF NOT EXISTS "version_hero_background_video_id" integer',
    );
  });

  it('backfills existing relation rows instead of introducing placeholder media', () => {
    expect(remainingDirectMediaColumnsSql).toContain('category_rel."path" = \'productGroup\'');
    expect(remainingDirectMediaColumnsSql).toContain('page_rel."path" = \'hero.backgroundImage\'');
    expect(remainingDirectMediaColumnsSql).toContain('page_rel."path" = \'seo.ogImage\'');
    expect(remainingDirectMediaColumnsSql).toContain(
      '"product_groups_seo_og_image_id_media_id_fk"',
    );
  });
});

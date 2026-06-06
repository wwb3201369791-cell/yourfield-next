import { describe, expect, it } from 'vitest';

import { newsSeoColumnsSql } from '@/migrations/20260606_030000_news_seo_columns';

describe('news SEO migration', () => {
  it('adds Payload SEO columns for news and localized news content', () => {
    expect(newsSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "news" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean',
    );
    expect(newsSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "news" ADD COLUMN IF NOT EXISTS "seo_canonical" varchar',
    );
    expect(newsSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "news" ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer',
    );
    expect(newsSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "news_locales" ADD COLUMN IF NOT EXISTS "seo_title" varchar',
    );
    expect(newsSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "news_locales" ADD COLUMN IF NOT EXISTS "seo_description" varchar',
    );
    expect(newsSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "news_locales" ADD COLUMN IF NOT EXISTS "seo_keywords" varchar',
    );
  });

  it('adds version columns and backfills existing SEO image relation rows', () => {
    expect(newsSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "_news_v" ADD COLUMN IF NOT EXISTS "version_seo_noindex" boolean',
    );
    expect(newsSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "_news_v" ADD COLUMN IF NOT EXISTS "version_seo_og_image_id" integer',
    );
    expect(newsSeoColumnsSql).toContain(
      'ALTER TABLE IF EXISTS "_news_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_title" varchar',
    );
    expect(newsSeoColumnsSql).toContain('news_rel."path" = \'seo.ogImage\'');
    expect(newsSeoColumnsSql).toContain('"news_seo_og_image_id_media_id_fk"');
  });
});

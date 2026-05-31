import { describe, expect, it } from 'vitest';

import { newsDirectMediaColumnsSql } from '@/migrations/20260530_020000_news_direct_media_columns';
import { newsFeaturedMediaSql } from '@/migrations/20260530_000000_news_featured_media';
import { newsFeaturedVideoRuSql } from '@/migrations/20260531_160000_news_featured_video_ru';

describe('news featured media migration', () => {
  it('adds the featured news order columns and indexes without adding relation columns', () => {
    expect(newsFeaturedMediaSql).toContain(
      'ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "featured_order" numeric',
    );
    expect(newsFeaturedMediaSql).toContain(
      'ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_featured_order" numeric',
    );
    expect(newsFeaturedMediaSql).toContain('CREATE INDEX IF NOT EXISTS "news_featured_order_idx"');
    expect(newsFeaturedMediaSql).toContain(
      'CREATE INDEX IF NOT EXISTS "_news_v_version_version_featured_order_idx"',
    );
    expect(newsFeaturedMediaSql).not.toContain('ADD COLUMN IF NOT EXISTS "media_id"');
  });

  it('backfills the three existing news preview videos into CMS media relations', () => {
    expect(newsFeaturedMediaSql).toContain("'/video/about.mp4'");
    expect(newsFeaturedMediaSql).toContain("'/video/culture.mp4'");
    expect(newsFeaturedMediaSql).toContain("'/video/home/hero-campus-background-loop.mp4'");
    expect(newsFeaturedMediaSql).toContain('INSERT INTO "media"');
    expect(newsFeaturedMediaSql).toContain(
      'INSERT INTO "news_rels" ("parent_id", "path", "media_id")',
    );
    expect(newsFeaturedMediaSql).toContain("'featuredVideo'");
    expect(newsFeaturedMediaSql).toContain('"featured_order" = featured_news."slot"');
    expect(newsFeaturedMediaSql).toContain('CASE WHEN "is_featured" THEN 0 ELSE 1 END');
  });

  it('adds Payload 3 direct upload columns for news cover and featured video fields', () => {
    expect(newsDirectMediaColumnsSql).toContain(
      'ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "cover_id" integer',
    );
    expect(newsDirectMediaColumnsSql).toContain(
      'ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "featured_video_id" integer',
    );
    expect(newsDirectMediaColumnsSql).toContain(
      'ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_cover_id" integer',
    );
    expect(newsDirectMediaColumnsSql).toContain(
      'ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_featured_video_id" integer',
    );
    expect(newsDirectMediaColumnsSql).toContain('"news_cover_id_media_id_fk"');
    expect(newsDirectMediaColumnsSql).toContain('"news_featured_video_id_media_id_fk"');
    expect(newsDirectMediaColumnsSql).toContain('"path" = \'featuredVideo\'');
  });

  it('adds and backfills the Russian featured news video field from existing video assets', () => {
    expect(newsFeaturedVideoRuSql).toContain(
      'ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "featured_video_ru_id" integer',
    );
    expect(newsFeaturedVideoRuSql).toContain(
      'ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_featured_video_ru_id" integer',
    );
    expect(newsFeaturedVideoRuSql).toContain('"news_featured_video_ru_id_media_id_fk"');
    expect(newsFeaturedVideoRuSql).toContain('"news_featured_video_ru_idx"');
    expect(newsFeaturedVideoRuSql).toContain("'/video/culture.mp4'");
    expect(newsFeaturedVideoRuSql).toContain("'/video/home/hero-campus-background-loop.mp4'");
    expect(newsFeaturedVideoRuSql).toContain("'/video/about.mp4'");
    expect(newsFeaturedVideoRuSql).toContain(
      'CASE WHEN "featured_order" > 0 THEN "featured_order" END',
    );
    expect(newsFeaturedVideoRuSql).toContain(
      '"featured_video_ru_id" = seed_media_with_slots."media_id"',
    );
  });
});

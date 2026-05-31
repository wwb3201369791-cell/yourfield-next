import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const newsFeaturedVideoRuSql = `
ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "featured_video_ru_id" integer;
ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_featured_video_ru_id" integer;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'media'
  ) THEN
    ALTER TABLE "news" ADD CONSTRAINT "news_featured_video_ru_id_media_id_fk" FOREIGN KEY ("featured_video_ru_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'media'
  ) THEN
    ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_featured_video_ru_id_media_id_fk" FOREIGN KEY ("version_featured_video_ru_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "news_featured_video_ru_idx" ON "news" USING btree ("featured_video_ru_id");
CREATE INDEX IF NOT EXISTS "_news_v_version_featured_video_ru_idx" ON "_news_v" USING btree ("version_featured_video_ru_id");

WITH seed_videos AS (
  SELECT *
  FROM (
    VALUES
      (1, '/video/culture.mp4', 'culture.mp4', 86498534, '俄语重点新闻视频 1'),
      (2, '/video/home/hero-campus-background-loop.mp4', 'hero-campus-background-loop.mp4', 5356281, '俄语重点新闻视频 2'),
      (3, '/video/about.mp4', 'about.mp4', 42747576, '俄语重点新闻视频 3')
  ) AS source("slot", "url", "filename", "filesize", "alt")
),
inserted_media AS (
  INSERT INTO "media" (
    "url",
    "filename",
    "mime_type",
    "filesize",
    "folder",
    "usage_count",
    "created_at",
    "updated_at"
  )
  SELECT
    seed_videos."url",
    seed_videos."filename",
    'video/mp4',
    seed_videos."filesize",
    'video',
    0,
    NOW(),
    NOW()
  FROM seed_videos
  WHERE NOT EXISTS (
    SELECT 1
    FROM "media"
    WHERE "media"."url" = seed_videos."url"
  )
  RETURNING "id", "url"
),
seed_media AS (
  SELECT MIN("id") AS "id", "url"
  FROM (
    SELECT "id", "url"
    FROM inserted_media

    UNION ALL

    SELECT "media"."id", "media"."url"
    FROM "media"
    INNER JOIN seed_videos ON seed_videos."url" = "media"."url"
  ) AS media_candidates
  GROUP BY "url"
),
seed_media_with_slots AS (
  SELECT seed_videos."slot", seed_videos."alt", seed_media."id" AS "media_id"
  FROM seed_videos
  INNER JOIN seed_media ON seed_media."url" = seed_videos."url"
),
featured_news AS (
  SELECT "id", "slot"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        ORDER BY
          CASE WHEN "featured_order" > 0 THEN "featured_order" END ASC NULLS LAST,
          CASE WHEN "is_featured" THEN 0 ELSE 1 END,
          "published_at" DESC NULLS LAST,
          "id" ASC
      ) AS "slot"
    FROM "news"
    WHERE "_status" = 'published'
  ) AS ranked_news
  WHERE "slot" <= 3
),
updated_news AS (
  UPDATE "news" AS target
  SET
    "featured_video_ru_id" = seed_media_with_slots."media_id",
    "updated_at" = NOW()
  FROM featured_news
  INNER JOIN seed_media_with_slots ON seed_media_with_slots."slot" = featured_news."slot"
  WHERE target."id" = featured_news."id"
    AND target."featured_video_ru_id" IS NULL
  RETURNING target."featured_video_ru_id"
),
inserted_media_locales AS (
  INSERT INTO "media_locales" ("alt", "_locale", "_parent_id")
  SELECT seed_media_with_slots."alt", locales."locale"::_locales, seed_media_with_slots."media_id"
  FROM seed_media_with_slots
  CROSS JOIN (
    VALUES ('zh'), ('en'), ('ru')
  ) AS locales("locale")
  ON CONFLICT ("_locale", "_parent_id") DO NOTHING
  RETURNING "_parent_id"
)
UPDATE "media" AS target
SET
  "usage_count" = COALESCE(target."usage_count", 0) + relation_counts."usage_count",
  "updated_at" = NOW()
FROM (
  SELECT "featured_video_ru_id" AS "media_id", COUNT(*) AS "usage_count"
  FROM updated_news
  WHERE "featured_video_ru_id" IS NOT NULL
  GROUP BY "featured_video_ru_id"
) AS relation_counts
WHERE target."id" = relation_counts."media_id";
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(newsFeaturedVideoRuSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: keep editor-selected Russian featured news videos in place.
}

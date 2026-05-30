import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const newsDirectMediaColumnsSql = `
ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "cover_id" integer;
ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "featured_video_id" integer;
ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_cover_id" integer;
ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_featured_video_id" integer;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'media'
  ) THEN
    ALTER TABLE "news" ADD CONSTRAINT "news_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'media'
  ) THEN
    ALTER TABLE "news" ADD CONSTRAINT "news_featured_video_id_media_id_fk" FOREIGN KEY ("featured_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'media'
  ) THEN
    ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'media'
  ) THEN
    ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_featured_video_id_media_id_fk" FOREIGN KEY ("version_featured_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "news_cover_idx" ON "news" USING btree ("cover_id");
CREATE INDEX IF NOT EXISTS "news_featured_video_idx" ON "news" USING btree ("featured_video_id");
CREATE INDEX IF NOT EXISTS "_news_v_version_cover_idx" ON "_news_v" USING btree ("version_cover_id");
CREATE INDEX IF NOT EXISTS "_news_v_version_featured_video_idx" ON "_news_v" USING btree ("version_featured_video_id");

UPDATE "news" AS target
SET "cover_id" = cover_rels."media_id"
FROM (
  SELECT DISTINCT ON ("parent_id") "parent_id", "media_id"
  FROM "news_rels"
  WHERE "path" = 'cover' AND "media_id" IS NOT NULL
  ORDER BY "parent_id", "order" ASC NULLS LAST
) AS cover_rels
WHERE target."id" = cover_rels."parent_id"
  AND target."cover_id" IS NULL;

UPDATE "news" AS target
SET "featured_video_id" = video_rels."media_id"
FROM (
  SELECT DISTINCT ON ("parent_id") "parent_id", "media_id"
  FROM "news_rels"
  WHERE "path" = 'featuredVideo' AND "media_id" IS NOT NULL
  ORDER BY "parent_id", "order" ASC NULLS LAST
) AS video_rels
WHERE target."id" = video_rels."parent_id"
  AND target."featured_video_id" IS NULL;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(newsDirectMediaColumnsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: direct media columns mirror editor-managed news media fields.
}

import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const newsSeoColumnsSql = `
ALTER TABLE IF EXISTS "news" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean;
ALTER TABLE IF EXISTS "news" ADD COLUMN IF NOT EXISTS "seo_canonical" varchar;
ALTER TABLE IF EXISTS "news" ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer;

ALTER TABLE IF EXISTS "news_locales" ADD COLUMN IF NOT EXISTS "seo_title" varchar;
ALTER TABLE IF EXISTS "news_locales" ADD COLUMN IF NOT EXISTS "seo_description" varchar;
ALTER TABLE IF EXISTS "news_locales" ADD COLUMN IF NOT EXISTS "seo_keywords" varchar;

ALTER TABLE IF EXISTS "_news_v" ADD COLUMN IF NOT EXISTS "version_seo_noindex" boolean;
ALTER TABLE IF EXISTS "_news_v" ADD COLUMN IF NOT EXISTS "version_seo_canonical" varchar;
ALTER TABLE IF EXISTS "_news_v" ADD COLUMN IF NOT EXISTS "version_seo_og_image_id" integer;

ALTER TABLE IF EXISTS "_news_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_title" varchar;
ALTER TABLE IF EXISTS "_news_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_description" varchar;
ALTER TABLE IF EXISTS "_news_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_keywords" varchar;

UPDATE "news" AS news
SET "seo_og_image_id" = news_rel."media_id"
FROM "news_rels" AS news_rel
WHERE news_rel."parent_id" = news."id"
  AND news_rel."path" = 'seo.ogImage'
  AND news_rel."media_id" IS NOT NULL
  AND news."seo_og_image_id" IS DISTINCT FROM news_rel."media_id";

UPDATE "_news_v" AS news_version
SET "version_seo_og_image_id" = news_rel."media_id"
FROM "_news_v_rels" AS news_rel
WHERE news_rel."parent_id" = news_version."id"
  AND news_rel."path" = 'seo.ogImage'
  AND news_rel."media_id" IS NOT NULL
  AND news_version."version_seo_og_image_id" IS DISTINCT FROM news_rel."media_id";

DO $$ BEGIN
  ALTER TABLE "news" ADD CONSTRAINT "news_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "news_seo_og_image_idx" ON "news" USING btree ("seo_og_image_id");
CREATE INDEX IF NOT EXISTS "_news_v_version_version_seo_og_image_idx" ON "_news_v" USING btree ("version_seo_og_image_id");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(newsSeoColumnsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: SEO fields may already contain editor-entered public metadata.
}

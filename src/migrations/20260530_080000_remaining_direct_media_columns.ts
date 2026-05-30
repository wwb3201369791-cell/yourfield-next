import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const remainingDirectMediaColumnsSql = `
ALTER TABLE IF EXISTS "product_groups" ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer;

ALTER TABLE IF EXISTS "product_categories" ADD COLUMN IF NOT EXISTS "product_group_id" integer;
ALTER TABLE IF EXISTS "product_categories" ADD COLUMN IF NOT EXISTS "parent_id" integer;
ALTER TABLE IF EXISTS "product_categories" ADD COLUMN IF NOT EXISTS "cover_id" integer;
ALTER TABLE IF EXISTS "product_categories" ADD COLUMN IF NOT EXISTS "icon_id" integer;
ALTER TABLE IF EXISTS "product_categories" ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer;

ALTER TABLE IF EXISTS "pages" ADD COLUMN IF NOT EXISTS "hero_background_image_id" integer;
ALTER TABLE IF EXISTS "pages" ADD COLUMN IF NOT EXISTS "hero_background_video_id" integer;
ALTER TABLE IF EXISTS "pages" ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer;
ALTER TABLE IF EXISTS "_pages_v" ADD COLUMN IF NOT EXISTS "version_hero_background_image_id" integer;
ALTER TABLE IF EXISTS "_pages_v" ADD COLUMN IF NOT EXISTS "version_hero_background_video_id" integer;
ALTER TABLE IF EXISTS "_pages_v" ADD COLUMN IF NOT EXISTS "version_seo_og_image_id" integer;

UPDATE "product_groups" AS product_group
SET "seo_og_image_id" = product_rel."media_id"
FROM "product_groups_rels" AS product_rel
WHERE product_rel."parent_id" = product_group."id"
  AND product_rel."path" = 'seo.ogImage'
  AND product_rel."media_id" IS NOT NULL
  AND product_group."seo_og_image_id" IS DISTINCT FROM product_rel."media_id";

UPDATE "product_categories" AS category
SET "product_group_id" = category_rel."product_groups_id"
FROM "product_categories_rels" AS category_rel
WHERE category_rel."parent_id" = category."id"
  AND category_rel."path" = 'productGroup'
  AND category_rel."product_groups_id" IS NOT NULL
  AND category."product_group_id" IS DISTINCT FROM category_rel."product_groups_id";

UPDATE "product_categories" AS category
SET "parent_id" = category_rel."product_categories_id"
FROM "product_categories_rels" AS category_rel
WHERE category_rel."parent_id" = category."id"
  AND category_rel."path" = 'parent'
  AND category_rel."product_categories_id" IS NOT NULL
  AND category."parent_id" IS DISTINCT FROM category_rel."product_categories_id";

UPDATE "product_categories" AS category
SET "cover_id" = category_rel."media_id"
FROM "product_categories_rels" AS category_rel
WHERE category_rel."parent_id" = category."id"
  AND category_rel."path" = 'cover'
  AND category_rel."media_id" IS NOT NULL
  AND category."cover_id" IS DISTINCT FROM category_rel."media_id";

UPDATE "product_categories" AS category
SET "icon_id" = category_rel."media_id"
FROM "product_categories_rels" AS category_rel
WHERE category_rel."parent_id" = category."id"
  AND category_rel."path" = 'icon'
  AND category_rel."media_id" IS NOT NULL
  AND category."icon_id" IS DISTINCT FROM category_rel."media_id";

UPDATE "product_categories" AS category
SET "seo_og_image_id" = category_rel."media_id"
FROM "product_categories_rels" AS category_rel
WHERE category_rel."parent_id" = category."id"
  AND category_rel."path" = 'seo.ogImage'
  AND category_rel."media_id" IS NOT NULL
  AND category."seo_og_image_id" IS DISTINCT FROM category_rel."media_id";

UPDATE "pages" AS page
SET "hero_background_image_id" = page_rel."media_id"
FROM "pages_rels" AS page_rel
WHERE page_rel."parent_id" = page."id"
  AND page_rel."path" = 'hero.backgroundImage'
  AND page_rel."media_id" IS NOT NULL
  AND page."hero_background_image_id" IS DISTINCT FROM page_rel."media_id";

UPDATE "pages" AS page
SET "hero_background_video_id" = page_rel."media_id"
FROM "pages_rels" AS page_rel
WHERE page_rel."parent_id" = page."id"
  AND page_rel."path" = 'hero.backgroundVideo'
  AND page_rel."media_id" IS NOT NULL
  AND page."hero_background_video_id" IS DISTINCT FROM page_rel."media_id";

UPDATE "pages" AS page
SET "seo_og_image_id" = page_rel."media_id"
FROM "pages_rels" AS page_rel
WHERE page_rel."parent_id" = page."id"
  AND page_rel."path" = 'seo.ogImage'
  AND page_rel."media_id" IS NOT NULL
  AND page."seo_og_image_id" IS DISTINCT FROM page_rel."media_id";

UPDATE "_pages_v" AS page_version
SET "version_hero_background_image_id" = page_rel."media_id"
FROM "_pages_v_rels" AS page_rel
WHERE page_rel."parent_id" = page_version."id"
  AND page_rel."path" = 'hero.backgroundImage'
  AND page_rel."media_id" IS NOT NULL
  AND page_version."version_hero_background_image_id" IS DISTINCT FROM page_rel."media_id";

UPDATE "_pages_v" AS page_version
SET "version_hero_background_video_id" = page_rel."media_id"
FROM "_pages_v_rels" AS page_rel
WHERE page_rel."parent_id" = page_version."id"
  AND page_rel."path" = 'hero.backgroundVideo'
  AND page_rel."media_id" IS NOT NULL
  AND page_version."version_hero_background_video_id" IS DISTINCT FROM page_rel."media_id";

UPDATE "_pages_v" AS page_version
SET "version_seo_og_image_id" = page_rel."media_id"
FROM "_pages_v_rels" AS page_rel
WHERE page_rel."parent_id" = page_version."id"
  AND page_rel."path" = 'seo.ogImage'
  AND page_rel."media_id" IS NOT NULL
  AND page_version."version_seo_og_image_id" IS DISTINCT FROM page_rel."media_id";

DO $$ BEGIN
  ALTER TABLE "product_groups" ADD CONSTRAINT "product_groups_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_group_id_product_groups_id_fk" FOREIGN KEY ("product_group_id") REFERENCES "public"."product_groups"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_product_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_background_image_id_media_id_fk" FOREIGN KEY ("hero_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_background_video_id_media_id_fk" FOREIGN KEY ("hero_background_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_background_image_id_media_id_fk" FOREIGN KEY ("version_hero_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_background_video_id_media_id_fk" FOREIGN KEY ("version_hero_background_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "product_groups_seo_og_image_idx" ON "product_groups" USING btree ("seo_og_image_id");
CREATE INDEX IF NOT EXISTS "product_categories_product_group_idx" ON "product_categories" USING btree ("product_group_id");
CREATE INDEX IF NOT EXISTS "product_categories_parent_idx" ON "product_categories" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "product_categories_cover_idx" ON "product_categories" USING btree ("cover_id");
CREATE INDEX IF NOT EXISTS "product_categories_icon_idx" ON "product_categories" USING btree ("icon_id");
CREATE INDEX IF NOT EXISTS "product_categories_seo_og_image_idx" ON "product_categories" USING btree ("seo_og_image_id");
CREATE INDEX IF NOT EXISTS "pages_hero_background_image_idx" ON "pages" USING btree ("hero_background_image_id");
CREATE INDEX IF NOT EXISTS "pages_hero_background_video_idx" ON "pages" USING btree ("hero_background_video_id");
CREATE INDEX IF NOT EXISTS "pages_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
CREATE INDEX IF NOT EXISTS "_pages_v_version_version_hero_background_image_idx" ON "_pages_v" USING btree ("version_hero_background_image_id");
CREATE INDEX IF NOT EXISTS "_pages_v_version_version_hero_background_video_idx" ON "_pages_v" USING btree ("version_hero_background_video_id");
CREATE INDEX IF NOT EXISTS "_pages_v_version_version_seo_og_image_idx" ON "_pages_v" USING btree ("version_seo_og_image_id");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(remainingDirectMediaColumnsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: direct media and product category relationships are public CMS content.
}

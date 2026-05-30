import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const pageBlockDirectRelationshipColumnsSql = `
ALTER TABLE IF EXISTS "pages_blocks_media_text" ADD COLUMN IF NOT EXISTS "media_id" integer;
ALTER TABLE IF EXISTS "_pages_v_blocks_media_text" ADD COLUMN IF NOT EXISTS "media_id" integer;
ALTER TABLE IF EXISTS "pages_blocks_product_showcase" ADD COLUMN IF NOT EXISTS "category_id" integer;
ALTER TABLE IF EXISTS "_pages_v_blocks_product_showcase" ADD COLUMN IF NOT EXISTS "category_id" integer;

UPDATE "pages_blocks_media_text" AS block
SET "media_id" = page_rel."media_id"
FROM "pages_rels" AS page_rel
WHERE page_rel."parent_id" = block."_parent_id"
  AND page_rel."path" = 'blocks.' || block."_order" || '.media'
  AND page_rel."media_id" IS NOT NULL
  AND block."media_id" IS DISTINCT FROM page_rel."media_id";

UPDATE "pages_blocks_product_showcase" AS block
SET "category_id" = page_rel."product_categories_id"
FROM "pages_rels" AS page_rel
WHERE page_rel."parent_id" = block."_parent_id"
  AND page_rel."path" = 'blocks.' || block."_order" || '.category'
  AND page_rel."product_categories_id" IS NOT NULL
  AND block."category_id" IS DISTINCT FROM page_rel."product_categories_id";

UPDATE "_pages_v_blocks_media_text" AS block
SET "media_id" = page_rel."media_id"
FROM "_pages_v_rels" AS page_rel
WHERE page_rel."parent_id" = block."_parent_id"
  AND page_rel."path" IN (
    'version.blocks.' || block."_order" || '.media',
    'blocks.' || block."_order" || '.media'
  )
  AND page_rel."media_id" IS NOT NULL
  AND block."media_id" IS DISTINCT FROM page_rel."media_id";

UPDATE "_pages_v_blocks_product_showcase" AS block
SET "category_id" = page_rel."product_categories_id"
FROM "_pages_v_rels" AS page_rel
WHERE page_rel."parent_id" = block."_parent_id"
  AND page_rel."path" IN (
    'version.blocks.' || block."_order" || '.category',
    'blocks.' || block."_order" || '.category'
  )
  AND page_rel."product_categories_id" IS NOT NULL
  AND block."category_id" IS DISTINCT FROM page_rel."product_categories_id";

CREATE INDEX IF NOT EXISTS "pages_blocks_media_text_media_idx" ON "pages_blocks_media_text" USING btree ("media_id");
CREATE INDEX IF NOT EXISTS "_pages_v_blocks_media_text_media_idx" ON "_pages_v_blocks_media_text" USING btree ("media_id");
CREATE INDEX IF NOT EXISTS "pages_blocks_product_showcase_category_idx" ON "pages_blocks_product_showcase" USING btree ("category_id");
CREATE INDEX IF NOT EXISTS "_pages_v_blocks_product_showcase_category_idx" ON "_pages_v_blocks_product_showcase" USING btree ("category_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_media_text_media_id_media_id_fk'
  ) THEN
    ALTER TABLE "pages_blocks_media_text" ADD CONSTRAINT "pages_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_blocks_media_text_media_id_media_id_fk'
  ) THEN
    ALTER TABLE "_pages_v_blocks_media_text" ADD CONSTRAINT "_pages_v_blocks_media_text_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pages_blocks_product_showcase_category_id_product_categories_id_fk'
  ) THEN
    ALTER TABLE "pages_blocks_product_showcase" ADD CONSTRAINT "pages_blocks_product_showcase_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '_pages_v_blocks_product_showcase_category_id_product_categories_id_fk'
  ) THEN
    ALTER TABLE "_pages_v_blocks_product_showcase" ADD CONSTRAINT "_pages_v_blocks_product_showcase_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await (payload as unknown as PayloadWithPgPool).db.pool.query(
    pageBlockDirectRelationshipColumnsSql,
  );
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await (payload as unknown as PayloadWithPgPool).db.pool.query(`
ALTER TABLE IF EXISTS "_pages_v_blocks_product_showcase" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_product_showcase_category_id_product_categories_id_fk";
ALTER TABLE IF EXISTS "pages_blocks_product_showcase" DROP CONSTRAINT IF EXISTS "pages_blocks_product_showcase_category_id_product_categories_id_fk";
ALTER TABLE IF EXISTS "_pages_v_blocks_media_text" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_media_text_media_id_media_id_fk";
ALTER TABLE IF EXISTS "pages_blocks_media_text" DROP CONSTRAINT IF EXISTS "pages_blocks_media_text_media_id_media_id_fk";
DROP INDEX IF EXISTS "_pages_v_blocks_product_showcase_category_idx";
DROP INDEX IF EXISTS "pages_blocks_product_showcase_category_idx";
DROP INDEX IF EXISTS "_pages_v_blocks_media_text_media_idx";
DROP INDEX IF EXISTS "pages_blocks_media_text_media_idx";
ALTER TABLE IF EXISTS "_pages_v_blocks_product_showcase" DROP COLUMN IF EXISTS "category_id";
ALTER TABLE IF EXISTS "pages_blocks_product_showcase" DROP COLUMN IF EXISTS "category_id";
ALTER TABLE IF EXISTS "_pages_v_blocks_media_text" DROP COLUMN IF EXISTS "media_id";
ALTER TABLE IF EXISTS "pages_blocks_media_text" DROP COLUMN IF EXISTS "media_id";
`);
}

import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const productSeoColumnsSql = `
ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "seo_noindex" boolean;
ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "seo_canonical" varchar;
ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer;

ALTER TABLE IF EXISTS "products_locales" ADD COLUMN IF NOT EXISTS "seo_title" varchar;
ALTER TABLE IF EXISTS "products_locales" ADD COLUMN IF NOT EXISTS "seo_description" varchar;
ALTER TABLE IF EXISTS "products_locales" ADD COLUMN IF NOT EXISTS "seo_keywords" varchar;

ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_seo_noindex" boolean;
ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_seo_canonical" varchar;
ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_seo_og_image_id" integer;

ALTER TABLE IF EXISTS "_products_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_title" varchar;
ALTER TABLE IF EXISTS "_products_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_description" varchar;
ALTER TABLE IF EXISTS "_products_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_keywords" varchar;

UPDATE "products" AS product
SET "seo_og_image_id" = product_rel."media_id"
FROM "products_rels" AS product_rel
WHERE product_rel."parent_id" = product."id"
  AND product_rel."path" = 'seo.ogImage'
  AND product_rel."media_id" IS NOT NULL
  AND product."seo_og_image_id" IS DISTINCT FROM product_rel."media_id";

UPDATE "_products_v" AS product_version
SET "version_seo_og_image_id" = product_rel."media_id"
FROM "_products_v_rels" AS product_rel
WHERE product_rel."parent_id" = product_version."id"
  AND product_rel."path" = 'seo.ogImage'
  AND product_rel."media_id" IS NOT NULL
  AND product_version."version_seo_og_image_id" IS DISTINCT FROM product_rel."media_id";

DO $$ BEGIN
  ALTER TABLE "products" ADD CONSTRAINT "products_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "products_seo_og_image_idx" ON "products" USING btree ("seo_og_image_id");
CREATE INDEX IF NOT EXISTS "_products_v_version_version_seo_og_image_idx" ON "_products_v" USING btree ("version_seo_og_image_id");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(productSeoColumnsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: SEO fields may already contain editor-entered public metadata.
}

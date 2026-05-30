import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const productsDirectVideoColumnSql = `
ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "video_id" integer;
ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_video_id" integer;

UPDATE "products" AS product
SET "video_id" = product_rel."media_id"
FROM "products_rels" AS product_rel
WHERE product_rel."parent_id" = product."id"
  AND product_rel."path" = 'video'
  AND product_rel."media_id" IS NOT NULL
  AND product."video_id" IS DISTINCT FROM product_rel."media_id";

UPDATE "_products_v" AS product_version
SET "version_video_id" = product_rel."media_id"
FROM "_products_v_rels" AS product_rel
WHERE product_rel."parent_id" = product_version."id"
  AND product_rel."path" = 'video'
  AND product_rel."media_id" IS NOT NULL
  AND product_version."version_video_id" IS DISTINCT FROM product_rel."media_id";

DO $$ BEGIN
  ALTER TABLE "products" ADD CONSTRAINT "products_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_video_id_media_id_fk" FOREIGN KEY ("version_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "products_video_idx" ON "products" USING btree ("video_id");
CREATE INDEX IF NOT EXISTS "_products_v_version_version_video_idx" ON "_products_v" USING btree ("version_video_id");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(productsDirectVideoColumnSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: product video assignments are public catalog content.
}

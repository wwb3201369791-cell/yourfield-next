import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const productsDirectProductGroupColumnSql = `
ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "product_group_id" integer;
ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_product_group_id" integer;

UPDATE "products" AS product
SET "product_group_id" = product_rel."product_groups_id"
FROM "products_rels" AS product_rel
WHERE product_rel."parent_id" = product."id"
  AND product_rel."path" = 'productGroup'
  AND product_rel."product_groups_id" IS NOT NULL
  AND product."product_group_id" IS DISTINCT FROM product_rel."product_groups_id";

UPDATE "_products_v" AS product_version
SET "version_product_group_id" = product_rel."product_groups_id"
FROM "_products_v_rels" AS product_rel
WHERE product_rel."parent_id" = product_version."id"
  AND product_rel."path" = 'productGroup'
  AND product_rel."product_groups_id" IS NOT NULL
  AND product_version."version_product_group_id" IS DISTINCT FROM product_rel."product_groups_id";

DO $$ BEGIN
  ALTER TABLE "products" ADD CONSTRAINT "products_product_group_id_product_groups_id_fk" FOREIGN KEY ("product_group_id") REFERENCES "public"."product_groups"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_product_group_id_product_groups_id_fk" FOREIGN KEY ("version_product_group_id") REFERENCES "public"."product_groups"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "products_product_group_idx" ON "products" USING btree ("product_group_id");
CREATE INDEX IF NOT EXISTS "_products_v_version_version_product_group_idx" ON "_products_v" USING btree ("version_product_group_id");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(productsDirectProductGroupColumnSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: product group assignments are public catalog content.
}

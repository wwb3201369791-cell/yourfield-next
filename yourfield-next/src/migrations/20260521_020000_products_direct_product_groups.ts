import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

const addProductsDirectProductGroupsSql = `
ALTER TABLE "products_rels" ADD COLUMN IF NOT EXISTS "product_groups_id" integer;
ALTER TABLE "_products_v_rels" ADD COLUMN IF NOT EXISTS "product_groups_id" integer;

DO $$ BEGIN
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_product_groups_fk" FOREIGN KEY ("product_groups_id") REFERENCES "public"."product_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_product_groups_fk" FOREIGN KEY ("product_groups_id") REFERENCES "public"."product_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "products_rels_product_groups_id_idx" ON "products_rels" USING btree ("product_groups_id");
CREATE INDEX IF NOT EXISTS "_products_v_rels_product_groups_id_idx" ON "_products_v_rels" USING btree ("product_groups_id");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(addProductsDirectProductGroupsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally left blank: this project does not run destructive local rollbacks automatically.
}

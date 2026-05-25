import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const productScenariosSql = `
CREATE TABLE IF NOT EXISTS "products_scenarios" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_locale" "_locales" NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar NOT NULL,
  "description" varchar
);

CREATE TABLE IF NOT EXISTS "_products_v_version_scenarios" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "_locale" "_locales" NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar NOT NULL,
  "description" varchar,
  "_uuid" varchar
);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    ALTER TABLE "products_scenarios" ADD CONSTRAINT "products_scenarios_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_products_v'
  ) THEN
    ALTER TABLE "_products_v_version_scenarios" ADD CONSTRAINT "_products_v_version_scenarios_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "products_scenarios_order_idx" ON "products_scenarios" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "products_scenarios_parent_id_idx" ON "products_scenarios" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "products_scenarios_locale_idx" ON "products_scenarios" USING btree ("_locale");
CREATE INDEX IF NOT EXISTS "_products_v_version_scenarios_order_idx" ON "_products_v_version_scenarios" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "_products_v_version_scenarios_parent_id_idx" ON "_products_v_version_scenarios" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "_products_v_version_scenarios_locale_idx" ON "_products_v_version_scenarios" USING btree ("_locale");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(productScenariosSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive by design: product scenario card rows are public CMS content.
}

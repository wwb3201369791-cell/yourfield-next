import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const productsProductFaqsLocalesSql = `
DO $$ DECLARE
  parent_id_type text;
BEGIN
  SELECT CASE
    WHEN data_type = 'integer' THEN 'integer'
    ELSE 'varchar'
  END INTO parent_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'products_product_faqs'
    AND column_name = 'id';

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS "products_product_faqs_locales" (
      "question" varchar,
      "answer" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" %s NOT NULL,
      CONSTRAINT "products_product_faqs_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
    )',
    COALESCE(parent_id_type, 'varchar')
  );
END $$;

DO $$ DECLARE
  parent_id_type text;
BEGIN
  SELECT CASE
    WHEN data_type = 'integer' THEN 'integer'
    ELSE 'varchar'
  END INTO parent_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = '_products_v_version_product_faqs'
    AND column_name = 'id';

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS "_products_v_version_product_faqs_locales" (
      "question" varchar,
      "answer" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" %s NOT NULL,
      CONSTRAINT "_products_v_version_product_faqs_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
    )',
    COALESCE(parent_id_type, 'integer')
  );
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products_product_faqs'
  ) THEN
    ALTER TABLE "products_product_faqs_locales" ADD CONSTRAINT "products_product_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_product_faqs"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_products_v_version_product_faqs'
  ) THEN
    ALTER TABLE "_products_v_version_product_faqs_locales" ADD CONSTRAINT "_products_v_version_product_faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_product_faqs"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

INSERT INTO "products_product_faqs_locales" ("question", "answer", "_locale", "_parent_id")
SELECT "question", "answer", "_locale", "id"
FROM "products_product_faqs"
WHERE "question" IS NOT NULL OR "answer" IS NOT NULL
ON CONFLICT ("_locale", "_parent_id") DO NOTHING;

INSERT INTO "_products_v_version_product_faqs_locales" ("question", "answer", "_locale", "_parent_id")
SELECT "question", "answer", "_locale", "id"
FROM "_products_v_version_product_faqs"
WHERE "question" IS NOT NULL OR "answer" IS NOT NULL
ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(productsProductFaqsLocalesSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: locale rows hold operator-entered product FAQ content.
}

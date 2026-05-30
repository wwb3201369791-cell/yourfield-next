import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const productScenariosLocalesSql = `
DO $$ DECLARE
  parent_id_type text;
BEGIN
  SELECT CASE
    WHEN data_type = 'integer' THEN 'integer'
    ELSE 'varchar'
  END INTO parent_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'products_scenarios'
    AND column_name = 'id';

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS "products_scenarios_locales" (
      "title" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" %s NOT NULL,
      CONSTRAINT "products_scenarios_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
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
    AND table_name = '_products_v_version_scenarios'
    AND column_name = 'id';

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS "_products_v_version_scenarios_locales" (
      "title" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" %s NOT NULL,
      CONSTRAINT "_products_v_version_scenarios_locales_locale_parent_id_unique" UNIQUE("_locale","_parent_id")
    )',
    COALESCE(parent_id_type, 'integer')
  );
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products_scenarios'
      AND column_name = 'title'
  ) THEN
    ALTER TABLE "products_scenarios" ALTER COLUMN "title" DROP NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '_products_v_version_scenarios'
      AND column_name = 'title'
  ) THEN
    ALTER TABLE "_products_v_version_scenarios" ALTER COLUMN "title" DROP NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products_scenarios'
  ) THEN
    ALTER TABLE "products_scenarios_locales" ADD CONSTRAINT "products_scenarios_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_scenarios"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_products_v_version_scenarios'
  ) THEN
    ALTER TABLE "_products_v_version_scenarios_locales" ADD CONSTRAINT "_products_v_version_scenarios_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_scenarios"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

INSERT INTO "products_scenarios_locales" ("title", "description", "_locale", "_parent_id")
SELECT "title", "description", "_locale", "id"
FROM "products_scenarios"
WHERE "title" IS NOT NULL OR "description" IS NOT NULL
ON CONFLICT ("_locale", "_parent_id") DO NOTHING;

INSERT INTO "_products_v_version_scenarios_locales" ("title", "description", "_locale", "_parent_id")
SELECT "title", "description", "_locale", "id"
FROM "_products_v_version_scenarios"
WHERE "title" IS NOT NULL OR "description" IS NOT NULL
ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(productScenariosLocalesSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: locale rows hold operator-entered product scenario content.
}

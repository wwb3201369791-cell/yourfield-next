import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const pagesDirectPageKeyColumnSql = `
ALTER TABLE IF EXISTS "pages" ADD COLUMN IF NOT EXISTS "page_key" "enum_pages_page_key";
ALTER TABLE IF EXISTS "_pages_v" ADD COLUMN IF NOT EXISTS "version_page_key" "enum__pages_v_version_page_key";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'pages'
      AND column_name = 'pageKey'
  ) THEN
    UPDATE "pages"
    SET "page_key" = "pageKey"
    WHERE "page_key" IS NULL
      AND "pageKey" IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = '_pages_v'
      AND column_name = 'version_pageKey'
  ) THEN
    UPDATE "_pages_v"
    SET "version_page_key" = "version_pageKey"
    WHERE "version_page_key" IS NULL
      AND "version_pageKey" IS NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "pages_page_key_v3_idx" ON "pages" USING btree ("page_key");
CREATE INDEX IF NOT EXISTS "_pages_v_version_page_key_v3_idx" ON "_pages_v" USING btree ("version_page_key");
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await (payload as unknown as PayloadWithPgPool).db.pool.query(pagesDirectPageKeyColumnSql);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await (payload as unknown as PayloadWithPgPool).db.pool.query(`
DROP INDEX IF EXISTS "_pages_v_version_page_key_v3_idx";
DROP INDEX IF EXISTS "pages_page_key_v3_idx";
ALTER TABLE IF EXISTS "_pages_v" DROP COLUMN IF EXISTS "version_page_key";
ALTER TABLE IF EXISTS "pages" DROP COLUMN IF EXISTS "page_key";
`);
}

import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

const payload3VersionMetadataSql = `
ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "parent_id" integer;
ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "snapshot" boolean;
ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "published_locale" varchar;

ALTER TABLE IF EXISTS "_solutions_v" ADD COLUMN IF NOT EXISTS "parent_id" integer;
ALTER TABLE IF EXISTS "_solutions_v" ADD COLUMN IF NOT EXISTS "snapshot" boolean;
ALTER TABLE IF EXISTS "_solutions_v" ADD COLUMN IF NOT EXISTS "published_locale" varchar;

ALTER TABLE IF EXISTS "_news_v" ADD COLUMN IF NOT EXISTS "parent_id" integer;
ALTER TABLE IF EXISTS "_news_v" ADD COLUMN IF NOT EXISTS "snapshot" boolean;
ALTER TABLE IF EXISTS "_news_v" ADD COLUMN IF NOT EXISTS "published_locale" varchar;

ALTER TABLE IF EXISTS "_pages_v" ADD COLUMN IF NOT EXISTS "parent_id" integer;
ALTER TABLE IF EXISTS "_pages_v" ADD COLUMN IF NOT EXISTS "snapshot" boolean;
ALTER TABLE IF EXISTS "_pages_v" ADD COLUMN IF NOT EXISTS "published_locale" varchar;

ALTER TABLE IF EXISTS "audit_logs" ADD COLUMN IF NOT EXISTS "user_id" integer;

UPDATE "_products_v" AS version
SET "parent_id" = product."id"
FROM "products" AS product
WHERE version."parent_id" IS NULL
  AND (
    version."version_product_id" = product."product_id"
    OR version."version_slug" = product."slug"
    OR version."version_sku" = product."sku"
  );

UPDATE "_solutions_v" AS version
SET "parent_id" = solution."id"
FROM "solutions" AS solution
WHERE version."parent_id" IS NULL
  AND (
    version."version_solution_id" = solution."solution_id"
    OR version."version_slug" = solution."slug"
  );

UPDATE "_news_v" AS version
SET "parent_id" = news."id"
FROM "news" AS news
WHERE version."parent_id" IS NULL
  AND version."version_slug" = news."slug";

UPDATE "_pages_v" AS version
SET "parent_id" = page."id"
FROM "pages" AS page
WHERE version."parent_id" IS NULL
  AND (
    version."version_page_key"::text = page."page_key"::text
    OR version."version_pageKey"::text = page."pageKey"::text
    OR version."version_slug" = page."slug"
  );

CREATE INDEX IF NOT EXISTS "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "_products_v_snapshot_idx" ON "_products_v" USING btree ("snapshot");
CREATE INDEX IF NOT EXISTS "_products_v_published_locale_idx" ON "_products_v" USING btree ("published_locale");

CREATE INDEX IF NOT EXISTS "_solutions_v_parent_idx" ON "_solutions_v" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "_solutions_v_snapshot_idx" ON "_solutions_v" USING btree ("snapshot");
CREATE INDEX IF NOT EXISTS "_solutions_v_published_locale_idx" ON "_solutions_v" USING btree ("published_locale");

CREATE INDEX IF NOT EXISTS "_news_v_parent_idx" ON "_news_v" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "_news_v_snapshot_idx" ON "_news_v" USING btree ("snapshot");
CREATE INDEX IF NOT EXISTS "_news_v_published_locale_idx" ON "_news_v" USING btree ("published_locale");

CREATE INDEX IF NOT EXISTS "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
CREATE INDEX IF NOT EXISTS "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");

CREATE INDEX IF NOT EXISTS "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");

DO $$ BEGIN
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_solutions_v" ADD CONSTRAINT "_solutions_v_parent_id_solutions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
`;

const dropPayload3VersionMetadataSql = `
ALTER TABLE IF EXISTS "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_user_id_users_id_fk";
ALTER TABLE IF EXISTS "_pages_v" DROP CONSTRAINT IF EXISTS "_pages_v_parent_id_pages_id_fk";
ALTER TABLE IF EXISTS "_news_v" DROP CONSTRAINT IF EXISTS "_news_v_parent_id_news_id_fk";
ALTER TABLE IF EXISTS "_solutions_v" DROP CONSTRAINT IF EXISTS "_solutions_v_parent_id_solutions_id_fk";
ALTER TABLE IF EXISTS "_products_v" DROP CONSTRAINT IF EXISTS "_products_v_parent_id_products_id_fk";

DROP INDEX IF EXISTS "audit_logs_user_idx";
DROP INDEX IF EXISTS "_pages_v_published_locale_idx";
DROP INDEX IF EXISTS "_pages_v_snapshot_idx";
DROP INDEX IF EXISTS "_pages_v_parent_idx";
DROP INDEX IF EXISTS "_news_v_published_locale_idx";
DROP INDEX IF EXISTS "_news_v_snapshot_idx";
DROP INDEX IF EXISTS "_news_v_parent_idx";
DROP INDEX IF EXISTS "_solutions_v_published_locale_idx";
DROP INDEX IF EXISTS "_solutions_v_snapshot_idx";
DROP INDEX IF EXISTS "_solutions_v_parent_idx";
DROP INDEX IF EXISTS "_products_v_published_locale_idx";
DROP INDEX IF EXISTS "_products_v_snapshot_idx";
DROP INDEX IF EXISTS "_products_v_parent_idx";

ALTER TABLE IF EXISTS "audit_logs" DROP COLUMN IF EXISTS "user_id";

ALTER TABLE IF EXISTS "_pages_v" DROP COLUMN IF EXISTS "published_locale";
ALTER TABLE IF EXISTS "_pages_v" DROP COLUMN IF EXISTS "snapshot";
ALTER TABLE IF EXISTS "_pages_v" DROP COLUMN IF EXISTS "parent_id";

ALTER TABLE IF EXISTS "_news_v" DROP COLUMN IF EXISTS "published_locale";
ALTER TABLE IF EXISTS "_news_v" DROP COLUMN IF EXISTS "snapshot";
ALTER TABLE IF EXISTS "_news_v" DROP COLUMN IF EXISTS "parent_id";

ALTER TABLE IF EXISTS "_solutions_v" DROP COLUMN IF EXISTS "published_locale";
ALTER TABLE IF EXISTS "_solutions_v" DROP COLUMN IF EXISTS "snapshot";
ALTER TABLE IF EXISTS "_solutions_v" DROP COLUMN IF EXISTS "parent_id";

ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "published_locale";
ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "snapshot";
ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "parent_id";
`;

export async function up({ payload }: MigrateUpArgs) {
  await (payload as PayloadWithPgPool).db.pool.query(payload3VersionMetadataSql);
}

export async function down({ payload }: MigrateDownArgs) {
  await (payload as PayloadWithPgPool).db.pool.query(dropPayload3VersionMetadataSql);
}

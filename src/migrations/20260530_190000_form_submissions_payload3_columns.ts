import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (sql: string, params?: unknown[]) => Promise<unknown>;
    };
  };
};

export const formSubmissionPayload3ColumnsSql = `
ALTER TABLE IF EXISTS "form_submissions" ADD COLUMN IF NOT EXISTS "inquiry_type" "enum_form_submissions_inquiry_type";
ALTER TABLE IF EXISTS "form_submissions" ADD COLUMN IF NOT EXISTS "source_locale" "enum_form_submissions_source_locale";
ALTER TABLE IF EXISTS "form_submissions" ADD COLUMN IF NOT EXISTS "product_ref_id" integer;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'form_submissions'
      AND column_name = 'inquiryType'
  ) THEN
    UPDATE "form_submissions"
    SET "inquiry_type" = "inquiryType"
    WHERE "inquiry_type" IS NULL
      AND "inquiryType" IS NOT NULL;
  END IF;
END $$;

UPDATE "form_submissions"
SET "inquiry_type" = 'message'
WHERE "inquiry_type" IS NULL;

ALTER TABLE IF EXISTS "form_submissions" ALTER COLUMN "inquiry_type" SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'form_submissions'
      AND column_name = 'sourceLocale'
  ) THEN
    UPDATE "form_submissions"
    SET "source_locale" = "sourceLocale"
    WHERE "source_locale" IS NULL
      AND "sourceLocale" IS NOT NULL;
  END IF;
END $$;

UPDATE "form_submissions" AS submission
SET "product_ref_id" = rel."products_id"
FROM (
  SELECT DISTINCT ON ("parent_id")
    "parent_id",
    "products_id"
  FROM "form_submissions_rels"
  WHERE "path" = 'productRef'
    AND "products_id" IS NOT NULL
  ORDER BY "parent_id", "order" ASC NULLS LAST, "id" ASC
) AS rel
WHERE rel."parent_id" = submission."id"
  AND submission."product_ref_id" IS NULL;

CREATE INDEX IF NOT EXISTS "form_submissions_inquiry_type_v3_idx" ON "form_submissions" USING btree ("inquiry_type");
CREATE INDEX IF NOT EXISTS "form_submissions_product_ref_idx" ON "form_submissions" USING btree ("product_ref_id");

DO $$ BEGIN
  ALTER TABLE "form_submissions"
    ADD CONSTRAINT "form_submissions_product_ref_id_products_id_fk"
    FOREIGN KEY ("product_ref_id")
    REFERENCES "public"."products"("id")
    ON DELETE set null
    ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_table THEN null;
END $$;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await (payload as unknown as PayloadWithPgPool).db.pool.query(formSubmissionPayload3ColumnsSql);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Non-destructive rollback: keep the direct Payload 3 columns and indexes in place.
  await (payload as unknown as PayloadWithPgPool).db.pool.query('SELECT 1');
}

import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const faqDirectRelationshipColumnsSql = `
ALTER TABLE IF EXISTS "faqs" ADD COLUMN IF NOT EXISTS "page_ref_id" integer;
ALTER TABLE IF EXISTS "faqs" ADD COLUMN IF NOT EXISTS "product_ref_id" integer;
ALTER TABLE IF EXISTS "faqs" ADD COLUMN IF NOT EXISTS "news_ref_id" integer;

UPDATE "faqs" AS faq
SET "page_ref_id" = rel."pages_id"
FROM "faqs_rels" AS rel
WHERE rel."parent_id" = faq."id"
  AND rel."path" = 'pageRef'
  AND rel."pages_id" IS NOT NULL
  AND faq."page_ref_id" IS DISTINCT FROM rel."pages_id";

UPDATE "faqs" AS faq
SET "product_ref_id" = rel."products_id"
FROM "faqs_rels" AS rel
WHERE rel."parent_id" = faq."id"
  AND rel."path" = 'productRef'
  AND rel."products_id" IS NOT NULL
  AND faq."product_ref_id" IS DISTINCT FROM rel."products_id";

UPDATE "faqs" AS faq
SET "news_ref_id" = rel."news_id"
FROM "faqs_rels" AS rel
WHERE rel."parent_id" = faq."id"
  AND rel."path" = 'newsRef'
  AND rel."news_id" IS NOT NULL
  AND faq."news_ref_id" IS DISTINCT FROM rel."news_id";

CREATE INDEX IF NOT EXISTS "faqs_page_ref_idx" ON "faqs" USING btree ("page_ref_id");
CREATE INDEX IF NOT EXISTS "faqs_product_ref_idx" ON "faqs" USING btree ("product_ref_id");
CREATE INDEX IF NOT EXISTS "faqs_news_ref_idx" ON "faqs" USING btree ("news_ref_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'faqs_page_ref_id_pages_id_fk'
  ) THEN
    ALTER TABLE "faqs" ADD CONSTRAINT "faqs_page_ref_id_pages_id_fk" FOREIGN KEY ("page_ref_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'faqs_product_ref_id_products_id_fk'
  ) THEN
    ALTER TABLE "faqs" ADD CONSTRAINT "faqs_product_ref_id_products_id_fk" FOREIGN KEY ("product_ref_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'faqs_news_ref_id_news_id_fk'
  ) THEN
    ALTER TABLE "faqs" ADD CONSTRAINT "faqs_news_ref_id_news_id_fk" FOREIGN KEY ("news_ref_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await (payload as unknown as PayloadWithPgPool).db.pool.query(faqDirectRelationshipColumnsSql);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await (payload as unknown as PayloadWithPgPool).db.pool.query(`
ALTER TABLE IF EXISTS "faqs" DROP CONSTRAINT IF EXISTS "faqs_news_ref_id_news_id_fk";
ALTER TABLE IF EXISTS "faqs" DROP CONSTRAINT IF EXISTS "faqs_product_ref_id_products_id_fk";
ALTER TABLE IF EXISTS "faqs" DROP CONSTRAINT IF EXISTS "faqs_page_ref_id_pages_id_fk";
DROP INDEX IF EXISTS "faqs_news_ref_idx";
DROP INDEX IF EXISTS "faqs_product_ref_idx";
DROP INDEX IF EXISTS "faqs_page_ref_idx";
ALTER TABLE IF EXISTS "faqs" DROP COLUMN IF EXISTS "news_ref_id";
ALTER TABLE IF EXISTS "faqs" DROP COLUMN IF EXISTS "product_ref_id";
ALTER TABLE IF EXISTS "faqs" DROP COLUMN IF EXISTS "page_ref_id";
`);
}

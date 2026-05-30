import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const pruneEmptyProductDraftsSql = `
DELETE FROM "_products_v" AS product_version
WHERE product_version."parent_id" IS NULL
  AND product_version."version__status" = 'draft'
  AND NULLIF(BTRIM(COALESCE(product_version."version_product_id", '')), '') IS NULL
  AND NULLIF(BTRIM(COALESCE(product_version."version_sku", '')), '') IS NULL
  AND NULLIF(BTRIM(COALESCE(product_version."version_model", '')), '') IS NULL
  AND NULLIF(BTRIM(COALESCE(product_version."version_slug", '')), '') IS NULL
  AND product_version."version_product_group_id" IS NULL
  AND product_version."version_video_id" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "_products_v_rels" AS product_version_rel
    WHERE product_version_rel."parent_id" = product_version."id"
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "_products_v_version_images" AS product_version_image
    WHERE product_version_image."_parent_id" = product_version."id"
  );

DELETE FROM "products" AS product
WHERE product."_status" = 'draft'
  AND NULLIF(BTRIM(COALESCE(product."product_id", '')), '') IS NULL
  AND NULLIF(BTRIM(COALESCE(product."sku", '')), '') IS NULL
  AND NULLIF(BTRIM(COALESCE(product."model", '')), '') IS NULL
  AND NULLIF(BTRIM(COALESCE(product."slug", '')), '') IS NULL
  AND product."product_group_id" IS NULL
  AND product."video_id" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "products_locales" AS product_locale
    WHERE product_locale."_parent_id" = product."id"
      AND NULLIF(BTRIM(COALESCE(product_locale."name", '')), '') IS NOT NULL
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "products_rels" AS product_rel
    WHERE product_rel."parent_id" = product."id"
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "products_images" AS product_image
    WHERE product_image."_parent_id" = product."id"
  );
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(pruneEmptyProductDraftsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive rollback: deleted rows were empty autosave drafts with no user-facing product data.
}

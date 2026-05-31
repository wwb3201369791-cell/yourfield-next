import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const backfillProductDisplayOrderByGroupSql = `
WITH product_group_members AS (
  SELECT
    product."id",
    COALESCE(product."product_group_id", product_rel."product_groups_id", 0) AS product_group_sort_id,
    NULLIF(BTRIM(COALESCE(product."product_id", '')), '') AS product_id,
    NULLIF(BTRIM(COALESCE(product."slug", '')), '') AS slug,
    NULLIF(BTRIM(COALESCE(product."model", '')), '') AS model,
    product."display_order"
  FROM "products" AS product
  LEFT JOIN LATERAL (
    SELECT relation."product_groups_id"
    FROM "products_rels" AS relation
    WHERE relation."parent_id" = product."id"
      AND relation."path" = 'productGroup'
      AND relation."product_groups_id" IS NOT NULL
    ORDER BY relation."order" ASC NULLS LAST, relation."id" ASC
    LIMIT 1
  ) AS product_rel ON true
),
group_max_display_order AS (
  SELECT
    product_group_members.product_group_sort_id,
    COALESCE(
      MAX(product_group_members."display_order") FILTER (WHERE product_group_members."display_order" > 0),
      0
    ) AS max_display_order
  FROM product_group_members
  GROUP BY product_group_members.product_group_sort_id
),
missing_display_order AS (
  SELECT
    product_group_members."id",
    product_group_members.product_group_sort_id,
    ROW_NUMBER() OVER (
      PARTITION BY product_group_sort_id
      ORDER BY
        COALESCE(product."product_id", product."slug", product."model", product."id"::text),
        product_group_members."id" ASC
    ) AS generated_display_order
  FROM product_group_members
  JOIN "products" AS product ON product."id" = product_group_members."id"
  WHERE product_group_members."display_order" IS NULL
     OR product_group_members."display_order" <= 0
)
UPDATE "products" AS product
SET
  "display_order" = group_max_display_order.max_display_order + missing_display_order.generated_display_order,
  "updated_at" = NOW()
FROM missing_display_order
JOIN group_max_display_order
  ON group_max_display_order.product_group_sort_id = missing_display_order.product_group_sort_id
WHERE product."id" = missing_display_order."id"
  AND (product."display_order" IS NULL OR product."display_order" <= 0);
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(backfillProductDisplayOrderByGroupSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: keep explicit per-group storefront display order values once assigned.
}

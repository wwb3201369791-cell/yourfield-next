import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

export const directOrderPositionTargets = [
  { columnName: 'order', tableName: 'solutions' },
  { columnName: 'order', tableName: 'product_groups' },
  { columnName: 'order', tableName: 'product_categories' },
  { columnName: 'order', tableName: 'faqs' },
  { columnName: 'display_order', tableName: 'products' },
] as const;

type DirectOrderPositionTarget = (typeof directOrderPositionTargets)[number];

export function normalizeDirectOrderSql({ columnName, tableName }: DirectOrderPositionTarget) {
  return `
WITH positive_order_rows AS (
  SELECT
    "id",
    "${columnName}",
    ROW_NUMBER() OVER (ORDER BY "${columnName}" ASC, "id" ASC) AS direct_order
  FROM "${tableName}"
  WHERE "${columnName}" IS NOT NULL AND "${columnName}" > 0
),
eligible_order_rows AS (
  SELECT *
  FROM positive_order_rows
  WHERE (
    SELECT COUNT(*) > 0 AND BOOL_AND("${columnName}" >= 10 AND "${columnName}" % 10 = 0)
    FROM positive_order_rows
  )
)
UPDATE "${tableName}" AS target
SET
  "${columnName}" = eligible_order_rows.direct_order,
  "updated_at" = NOW()
FROM eligible_order_rows
WHERE target."id" = eligible_order_rows."id";
`.trim();
}

export const directOrderPositionsSql = directOrderPositionTargets.map(normalizeDirectOrderSql)
  .join(`

`);

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { db } = payload as unknown as PayloadWithPgPool;

  await db.pool.query(directOrderPositionsSql);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-destructive: keep the operator-facing direct order values in place.
}

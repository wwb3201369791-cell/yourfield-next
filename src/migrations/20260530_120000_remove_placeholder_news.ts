import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (sql: string, params?: unknown[]) => Promise<unknown>;
    };
  };
};

export const removePlaceholderNewsSql = `
DELETE FROM "news"
WHERE EXISTS (
  SELECT 1
  FROM "news_locales"
  WHERE "news_locales"."_parent_id" = "news"."id"
    AND (
      "news_locales"."title" ILIKE '%示例：%'
      OR "news_locales"."title" ILIKE '%待补充%'
      OR "news_locales"."title" ILIKE 'Example:%'
      OR "news_locales"."title" ILIKE '%Pending%'
      OR "news_locales"."title" ILIKE 'Пример:%'
      OR "news_locales"."excerpt" ILIKE '%前台版式示例%'
      OR "news_locales"."excerpt" ILIKE '%layout sample%'
      OR "news_locales"."excerpt" ILIKE '%пример макета%'
    )
);
`;

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await (payload as unknown as PayloadWithPgPool).db.pool.query(removePlaceholderNewsSql);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Non-destructive rollback: placeholder news records were intentionally removed from CMS data.
  await (payload as unknown as PayloadWithPgPool).db.pool.query('SELECT 1');
}

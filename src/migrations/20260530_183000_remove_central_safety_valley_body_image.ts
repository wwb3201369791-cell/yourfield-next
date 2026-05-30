import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

type PayloadWithPgPool = {
  db: {
    pool: {
      query: (statement: string) => Promise<unknown>;
    };
  };
};

const removeCentralSafetyValleyBodyImageSql = `
WITH target_news AS (
  SELECT "id"
  FROM "news"
  WHERE "slug" = 'central-safety-valley'
),
rewritten_locales AS (
  SELECT
    locale."id",
    jsonb_set(
      locale."content",
      '{root,children}',
      COALESCE(
        (
          SELECT jsonb_agg(child ORDER BY ord)
          FROM jsonb_array_elements(locale."content" #> '{root,children}') WITH ORDINALITY AS item(child, ord)
          WHERE child->>'type' <> 'upload'
        ),
        '[]'::jsonb
      ),
      false
    ) AS "content"
  FROM "news_locales" AS locale
  INNER JOIN target_news ON target_news."id" = locale."_parent_id"
  WHERE locale."content" #> '{root,children}' IS NOT NULL
)
UPDATE "news_locales" AS locale
SET "content" = rewritten_locales."content"
FROM rewritten_locales
WHERE locale."id" = rewritten_locales."id"
  AND locale."content" IS DISTINCT FROM rewritten_locales."content";

WITH target_news AS (
  SELECT "id"
  FROM "news"
  WHERE "slug" = 'central-safety-valley'
),
rewritten_version_locales AS (
  SELECT
    version_locale."id",
    jsonb_set(
      version_locale."version_content",
      '{root,children}',
      COALESCE(
        (
          SELECT jsonb_agg(child ORDER BY ord)
          FROM jsonb_array_elements(version_locale."version_content" #> '{root,children}') WITH ORDINALITY AS item(child, ord)
          WHERE child->>'type' <> 'upload'
        ),
        '[]'::jsonb
      ),
      false
    ) AS "version_content"
  FROM "_news_v_locales" AS version_locale
  INNER JOIN "_news_v" AS version ON version."id" = version_locale."_parent_id"
  INNER JOIN target_news ON target_news."id" = version."parent_id"
  WHERE version_locale."version_content" #> '{root,children}' IS NOT NULL
)
UPDATE "_news_v_locales" AS version_locale
SET "version_content" = rewritten_version_locales."version_content"
FROM rewritten_version_locales
WHERE version_locale."id" = rewritten_version_locales."id"
  AND version_locale."version_content" IS DISTINCT FROM rewritten_version_locales."version_content";
`;

export async function up({ payload }: MigrateUpArgs) {
  await (payload as PayloadWithPgPool).db.pool.query(removeCentralSafetyValleyBodyImageSql);
}

export function down(args: MigrateDownArgs) {
  void args;
  // This migration removes editorial body media from one article; it is not reversible.
}
